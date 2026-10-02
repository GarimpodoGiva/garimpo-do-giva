/* ============================================================
   CENTRAL DO GARIMPO V3
   Supabase Auth + PostgreSQL + RLS
   ============================================================ */

const CONFIG = window.GARIMPO_SUPABASE || {};
const SUPABASE_URL = CONFIG.url || "";
const SUPABASE_KEY = CONFIG.publishableKey || "";

let supabaseClient = null;
let products = [];
let currentUser = null;

const $ = (id) => document.getElementById(id);

document.addEventListener("DOMContentLoaded", init);

async function init() {
  if (!SUPABASE_URL || !SUPABASE_KEY || SUPABASE_KEY.includes("COLE_AQUI")) {
    showLoginMessage("Falta configurar a Publishable Key no arquivo supabase-config.js.", true);
    $("loginForm").querySelector("button[type=submit]").disabled = true;
    return;
  }

  supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false
    }
  });

  bindEvents();

  const { data: { session } } = await supabaseClient.auth.getSession();
  if (session?.user) {
    await enterAdmin(session.user);
  } else {
    showLogin();
  }

  supabaseClient.auth.onAuthStateChange(async (event, session) => {
    if (session?.user) {
      await enterAdmin(session.user);
    } else if (event === "SIGNED_OUT") {
      showLogin();
    }
  });
}

function bindEvents() {
  $("loginForm").addEventListener("submit", handleLogin);
  $("logoutBtn").addEventListener("click", handleLogout);
  $("togglePassword").addEventListener("click", () => {
    const input = $("password");
    input.type = input.type === "password" ? "text" : "password";
    $("togglePassword").textContent = input.type === "password" ? "👁" : "🙈";
  });

  $("newProductBtn").addEventListener("click", () => openForm());
  $("closeFormBtn").addEventListener("click", closeForm);
  $("cancelFormBtn").addEventListener("click", closeForm);
  $("refreshBtn").addEventListener("click", loadProducts);
  $("productForm").addEventListener("submit", saveProduct);

  ["vendidos","nota","comissao","preco","avaliacoes"].forEach(id => {
    $(id).addEventListener("input", updateScorePreview);
  });
}

async function handleLogin(event) {
  event.preventDefault();
  clearMessage("loginMessage");

  const email = $("email").value.trim();
  const password = $("password").value;

  if (email.toLowerCase() !== "garimpodogiva@gmail.com") {
    showLoginMessage("Este acesso é reservado ao administrador do Garimpo do Giva.", true);
    return;
  }

  const button = event.submitter;
  button.disabled = true;
  button.textContent = "Entrando...";

  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email,
    password
  });

  button.disabled = false;
  button.textContent = "Entrar na Central";

  if (error) {
    showLoginMessage("Não foi possível entrar. Confira o e-mail e a senha.", true);
    return;
  }

  if (!data.user) {
    showLoginMessage("Login sem usuário autenticado.", true);
    return;
  }

  $("password").value = "";
  await enterAdmin(data.user);
}

async function handleLogout() {
  await supabaseClient.auth.signOut();
}

async function enterAdmin(user) {
  currentUser = user;

  if ((user.email || "").toLowerCase() !== "garimpodogiva@gmail.com") {
    await supabaseClient.auth.signOut();
    showLoginMessage("Usuário não autorizado para esta Central.", true);
    return;
  }

  $("userEmail").textContent = user.email;
  $("loginView").classList.add("hidden");
  $("adminView").classList.remove("hidden");
  clearMessage("loginMessage");
  await loadProducts();
}

function showLogin() {
  $("adminView").classList.add("hidden");
  $("loginView").classList.remove("hidden");
}

async function loadProducts() {
  setLoading(true);
  clearMessage("globalMessage");

  const { data, error } = await supabaseClient
    .from("produtos")
    .select("*")
    .order("created_at", { ascending: false });

  setLoading(false);

  if (error) {
    showGlobalMessage("Erro ao carregar produtos: " + error.message, true);
    return;
  }

  products = data || [];
  renderProducts();
  updateStats();
}

function renderProducts() {
  const list = $("productList");
  list.innerHTML = "";

  $("emptyState").classList.toggle("hidden", products.length !== 0);

  for (const product of products) {
    const row = document.createElement("article");
    row.className = "product-row";

    const thumb = document.createElement("img");
    thumb.className = "product-thumb";
    thumb.src = product.imagem || "";
    thumb.alt = "";
    thumb.onerror = () => {
      thumb.removeAttribute("src");
      thumb.style.opacity = "0";
    };

    const info = document.createElement("div");
    info.className = "product-info";

    const title = document.createElement("h3");
    title.textContent = product.nome;

    const meta = document.createElement("div");
    meta.className = "product-meta";

    meta.appendChild(pill(product.status || "reserva", product.status || "reserva"));
    meta.appendChild(pill("Score " + (product.score ?? 0) + "/100"));
    if (product.preco != null) meta.appendChild(pill(formatBRL(product.preco)));
    if (product.categoria) meta.appendChild(pill(product.categoria));

    info.appendChild(title);
    info.appendChild(meta);

    const actions = document.createElement("div");
    actions.className = "row-actions";

    const edit = document.createElement("button");
    edit.className = "btn btn-secondary small-btn";
    edit.textContent = "Editar";
    edit.addEventListener("click", () => openForm(product));

    const toggle = document.createElement("button");
    toggle.className = "btn btn-secondary small-btn";
    toggle.textContent = product.status === "inativo" ? "Ativar" : "Inativar";
    toggle.addEventListener("click", () => toggleStatus(product));

    const del = document.createElement("button");
    del.className = "btn danger small-btn";
    del.textContent = "Excluir";
    del.addEventListener("click", () => deleteProduct(product));

    actions.append(edit, toggle, del);
    row.append(thumb, info, actions);
    list.appendChild(row);
  }
}

function pill(text, className = "") {
  const span = document.createElement("span");
  span.className = "pill " + className;
  span.textContent = text;
  return span;
}

function updateStats() {
  $("statTotal").textContent = products.length;
  $("statPublicados").textContent = products.filter(p => p.status === "publicado").length;
  $("statReservas").textContent = products.filter(p => p.status === "reserva").length;
  const average = products.length
    ? Math.round(products.reduce((sum, p) => sum + Number(p.score || 0), 0) / products.length)
    : 0;
  $("statScore").textContent = average;
}

function openForm(product = null) {
  $("productFormSection").classList.remove("hidden");
  $("productForm").reset();
  $("productId").value = "";
  $("status").value = "reserva";
  $("formTitle").textContent = product ? "Editar produto" : "Novo produto";
  $("saveBtnText").textContent = product ? "Salvar alterações" : "Salvar produto";
  clearMessage("formMessage");

  if (product) {
    $("productId").value = product.id;
    $("nome").value = product.nome || "";
    $("categoria").value = product.categoria || "";
    $("preco").value = product.preco ?? "";
    $("comissao").value = product.comissao ?? "";
    $("nota").value = product.nota ?? "";
    $("avaliacoes").value = product.avaliacoes || "";
    $("vendidos").value = product.vendidos || "";
    $("loja").value = product.loja || "";
    $("status").value = product.status || "reserva";
    $("imagem").value = product.imagem || "";
    $("link").value = product.link || "";
    $("observacao").value = product.observacao || "";
  }

  updateScorePreview();
  window.scrollTo({ top: $("productFormSection").offsetTop - 20, behavior: "smooth" });
}

function closeForm() {
  $("productFormSection").classList.add("hidden");
  clearMessage("formMessage");
}

async function saveProduct(event) {
  event.preventDefault();
  clearMessage("formMessage");

  const name = $("nome").value.trim();
  const link = $("link").value.trim();

  if (!name || !link) {
    showFormMessage("Preencha o nome e o link de afiliado.", true);
    return;
  }

  const score = calculateScore({
    vendidos: $("vendidos").value,
    nota: $("nota").value,
    comissao: $("comissao").value,
    avaliacoes: $("avaliacoes").value,
    preco: $("preco").value
  });

  const payload = {
    nome: name,
    categoria: $("categoria").value.trim() || null,
    preco: numberOrNull($("preco").value),
    comissao: numberOrNull($("comissao").value),
    nota: numberOrNull($("nota").value),
    avaliacoes: $("avaliacoes").value.trim() || null,
    vendidos: $("vendidos").value.trim() || null,
    loja: $("loja").value.trim() || null,
    score,
    status: $("status").value,
    imagem: $("imagem").value.trim() || null,
    link,
    observacao: $("observacao").value.trim() || null
  };

  const id = $("productId").value;
  const button = $("productForm").querySelector('button[type="submit"]');
  button.disabled = true;
  $("saveBtnText").textContent = id ? "Salvando..." : "Cadastrando...";

  let result;

  if (id) {
    result = await supabaseClient
      .from("produtos")
      .update(payload)
      .eq("id", id)
      .select()
      .single();
  } else {
    result = await supabaseClient
      .from("produtos")
      .insert(payload)
      .select()
      .single();
  }

  button.disabled = false;
  $("saveBtnText").textContent = id ? "Salvar alterações" : "Salvar produto";

  if (result.error) {
    showFormMessage("Não foi possível salvar: " + result.error.message, true);
    return;
  }

  showGlobalMessage(id ? "Produto atualizado com sucesso." : "Produto cadastrado com sucesso.", false);
  closeForm();
  await loadProducts();
}

async function toggleStatus(product) {
  const newStatus = product.status === "inativo" ? "reserva" : "inativo";

  const { error } = await supabaseClient
    .from("produtos")
    .update({ status: newStatus })
    .eq("id", product.id);

  if (error) {
    showGlobalMessage("Não foi possível alterar o status: " + error.message, true);
    return;
  }

  showGlobalMessage(newStatus === "inativo" ? "Produto inativado." : "Produto reativado.", false);
  await loadProducts();
}

async function deleteProduct(product) {
  const confirmed = window.confirm(
    `Excluir definitivamente este produto?\n\n${product.nome}`
  );

  if (!confirmed) return;

  const { error } = await supabaseClient
    .from("produtos")
    .delete()
    .eq("id", product.id);

  if (error) {
    showGlobalMessage("Não foi possível excluir: " + error.message, true);
    return;
  }

  showGlobalMessage("Produto excluído.", false);
  await loadProducts();
}

function calculateScore({ vendidos, nota, comissao, avaliacoes, preco }) {
  const sales = parseMetric(vendidos);
  const reviews = parseMetric(avaliacoes);
  const rating = Number(nota) || 0;
  const commission = Number(comissao) || 0;
  const price = Number(preco) || 0;

  let salesPoints = 0;
  if (sales >= 100000) salesPoints = 30;
  else if (sales >= 50000) salesPoints = 28;
  else if (sales >= 20000) salesPoints = 25;
  else if (sales >= 10000) salesPoints = 22;
  else if (sales >= 5000) salesPoints = 18;
  else if (sales >= 1000) salesPoints = 14;
  else if (sales > 0) salesPoints = 8;

  let ratingPoints = Math.min(20, Math.max(0, (rating / 5) * 20));
  let commissionPoints = Math.min(20, Math.max(0, (commission / 20) * 20));

  let reviewPoints = 0;
  if (reviews >= 100000) reviewPoints = 15;
  else if (reviews >= 50000) reviewPoints = 14;
  else if (reviews >= 20000) reviewPoints = 12;
  else if (reviews >= 10000) reviewPoints = 10;
  else if (reviews >= 5000) reviewPoints = 8;
  else if (reviews >= 1000) reviewPoints = 6;
  else if (reviews > 0) reviewPoints = 3;

  let pricePoints = 0;
  if (price > 0 && price <= 15) pricePoints = 15;
  else if (price <= 30) pricePoints = 13;
  else if (price <= 50) pricePoints = 10;
  else if (price <= 100) pricePoints = 6;
  else if (price > 100) pricePoints = 3;

  return Math.round(
    Math.min(100, salesPoints + ratingPoints + commissionPoints + reviewPoints + pricePoints)
  );
}

function updateScorePreview() {
  const score = calculateScore({
    vendidos: $("vendidos").value,
    nota: $("nota").value,
    comissao: $("comissao").value,
    avaliacoes: $("avaliacoes").value,
    preco: $("preco").value
  });

  $("scorePreview").textContent = score + "/100";
  $("scoreBar").style.width = score + "%";
}

function parseMetric(value) {
  if (value == null) return 0;
  const raw = String(value).toLowerCase().trim().replace(",", ".");
  if (!raw) return 0;

  const numberMatch = raw.match(/\d+(?:\.\d+)?/);
  if (!numberMatch) return 0;

  let n = Number(numberMatch[0]);
  if (raw.includes("mil")) n *= 1000;
  else if (raw.includes("mi")) n *= 1000000;

  return Number.isFinite(n) ? n : 0;
}

function numberOrNull(value) {
  if (value === "" || value == null) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function formatBRL(value) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(Number(value || 0));
}

function setLoading(value) {
  $("loading").classList.toggle("hidden", !value);
}

function showLoginMessage(message, error = false) {
  $("loginMessage").textContent = message;
  $("loginMessage").className = "message " + (error ? "error" : "success");
}

function showFormMessage(message, error = false) {
  $("formMessage").textContent = message;
  $("formMessage").className = "message " + (error ? "error" : "success");
}

function showGlobalMessage(message, error = false) {
  $("globalMessage").textContent = message;
  $("globalMessage").className = "message global-message " + (error ? "error" : "success");
}

function clearMessage(id) {
  $(id).textContent = "";
  $(id).className = "message" + (id === "globalMessage" ? " global-message" : "");
}
