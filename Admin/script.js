// ============================================================
// GARIMPO DO GIVA — SITE PRINCIPAL
// ============================================================

// ------------------------------------------------------------
// RECUPERAÇÃO DE SENHA
// ------------------------------------------------------------
// O Supabase devolve o token de recuperação no hash da URL.
// Se isso acontecer, encaminhamos para a tela própria de
// redefinição de senha.
// ------------------------------------------------------------

if (
  window.location.hash.includes("type=recovery") &&
  window.location.hash.includes("access_token=")
) {
  window.location.replace(
    "Admin/reset-password.html" + window.location.hash
  );
} else {

  const produtosEl = document.getElementById("produtos");
  const contadorEl = document.getElementById("contador");
  const anoEl = document.getElementById("ano");

  anoEl.textContent = new Date().getFullYear();


  function escapeHtml(valor) {

    return String(valor ?? "").replace(
      /[&<>"']/g,
      caractere => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
      }[caractere])
    );

  }


  function formatarPreco(valor) {

    const numero = Number(valor);

    if (!Number.isFinite(numero)) {
      return "";
    }

    return new Intl.NumberFormat(
      "pt-BR",
      {
        style: "currency",
        currency: "BRL"
      }
    ).format(numero);

  }


  function renderProdutos(produtos) {

    contadorEl.textContent =
      produtos.length
        ? produtos.length + " achado(s)"
        : "";


    if (!produtos.length) {

      produtosEl.innerHTML =
        '<article class="vazio">' +
          '<div class="icone">🔎</div>' +
          '<h3>O garimpo está começando</h3>' +
          '<p>' +
            'Estamos preparando os primeiros produtos selecionados. ' +
            'Quando os achados entrarem, eles aparecerão aqui com ' +
            'suas informações e links.' +
          '</p>' +
        '</article>';

      return;
    }


    produtosEl.innerHTML = produtos.map(produto => {

      const imagem = produto.imagem

        ? '<img src="' +
            escapeHtml(produto.imagem) +
            '" alt="' +
            escapeHtml(produto.nome) +
            '" loading="lazy" ' +
            'onerror="this.parentElement.innerHTML=\'🔎\';">'

        : "🔎";


      const preco =
        produto.preco != null

          ? '<div class="produto-preco">' +
              formatarPreco(produto.preco) +
            '</div>'

          : "";


      const link =
        produto.link

          ? '<a class="btn btn-primary" ' +
              'href="' +
              escapeHtml(produto.link) +
              '" target="_blank" ' +
              'rel="nofollow sponsored noopener">' +
              'Ver achado' +
            '</a>'

          : "";


      return (
        '<article class="produto">' +

          '<div class="produto-imagem">' +
            imagem +
          '</div>' +

          '<div class="produto-corpo">' +

            '<div class="produto-cat">' +
              escapeHtml(
                produto.categoria || "Achado"
              ) +
            '</div>' +

            '<h3>' +
              escapeHtml(produto.nome) +
            '</h3>' +

            preco +

            link +

          '</div>' +

        '</article>'
      );

    }).join("");

  }


  fetch(
    "produtos.json",
    {
      cache: "no-store"
    }
  )

    .then(response => {

      if (!response.ok) {

        throw new Error(
          "Falha ao carregar produtos.json"
        );

      }

      return response.json();

    })

    .then(data => {

      renderProdutos(
        data.produtos || []
      );

    })

    .catch(() => {

      renderProdutos([]);

    });

}