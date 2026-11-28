import { expect, test } from "@playwright/test";

const headers = { Origin: "http://127.0.0.1:3100" };

test("painel exige sessão e recusa alteração anônima", async ({ page, request }) => {
  await page.goto("/admin/cardapio");
  await expect(page).toHaveURL(/\/admin\/login/);
  const response = await request.post("/api/admin/categories", { headers, data: { name: "Teste", slug: "teste", status: "draft", position: 0 } });
  expect(response.status()).toBe(401);
  const responseWithoutOrigin = await request.post("/api/admin/categories", { data: {} });
  expect(responseWithoutOrigin.status()).toBe(403);
});

test("sessão demo permite CRUD, valida dados e protege categoria vinculada", async ({ page }) => {
  await page.goto("/admin/login");
  await page.getByRole("button", { name: "Entrar na demonstração", exact: true }).click();
  await expect(page).toHaveURL(/\/admin$/);
  const cookies = await page.context().cookies();
  const session = cookies.find(cookie => cookie.name === "lucrecio-demo-session");
  expect(session?.httpOnly).toBe(true);
  expect(session?.sameSite).toBe("Lax");
  const reset = await page.request.post("/api/admin/reset", { headers });
  expect(reset.ok()).toBeTruthy();

  const categoryResult = await page.request.post("/api/admin/categories", {
    headers, data: { name: "Categoria de teste", slug: "categoria-teste-e2e", position: 50, status: "published" },
  });
  expect(categoryResult.ok()).toBeTruthy();
  const category = await categoryResult.json();
  const categoryId = category.id ?? category.data?.id;
  expect(categoryId).toEqual(expect.any(String));
  const productData = {
    name: "Porção de teste E2E", slug: "porcao-teste-e2e", category_id: categoryId,
    description: "Registro criado por teste automatizado no banco demonstrativo.",
    image: null, images: [], price_cents: 4250, variants: [], addons: [],
    ingredients: "", allergens: "", serves: "", available: true, featured: false, position: 50, status: "published",
  };
  const productResult = await page.request.post("/api/admin/products", { headers, data: productData });
  expect(productResult.ok()).toBeTruthy();
  const product = await productResult.json();
  const productId = product.id ?? product.data?.id;
  expect(productId).toEqual(expect.any(String));
  await page.goto("/cardapio/porcao-teste-e2e");
  await expect(page.getByRole("heading", { level: 1, name: "Porção de teste E2E" })).toBeVisible();
  await expect(page.getByText(/42,50/).first()).toBeVisible();

  const invalid = await page.request.patch(`/api/admin/products/${productId}`, { headers, data: { price_cents: -100 } });
  expect(invalid.status()).toBe(422);
  const linkedDelete = await page.request.delete(`/api/admin/categories/${categoryId}`, { headers });
  expect(linkedDelete.status()).toBe(409);
  const update = await page.request.patch(`/api/admin/products/${productId}`, { headers, data: { price_cents: 4500, available: false } });
  expect(update.ok()).toBeTruthy();
  await page.reload();
  await expect(page.getByText(/45,00/).first()).toBeVisible();
  await expect(page.getByText(/indisponível/i).first()).toBeVisible();
  const archive = await page.request.patch(`/api/admin/products/${productId}`, { headers, data: { status: "archived" } });
  expect(archive.ok()).toBeTruthy();
  expect((await page.request.get("/cardapio/porcao-teste-e2e")).status()).toBe(404);
  expect((await page.request.delete(`/api/admin/products/${productId}`, { headers })).ok()).toBeTruthy();
  expect((await page.request.delete(`/api/admin/categories/${categoryId}`, { headers })).ok()).toBeTruthy();

  const unsafe = await page.request.post("/api/admin/upload", { headers, multipart: {
    file: { name: "documento.txt", mimeType: "text/plain", buffer: Buffer.from("Conteúdo textual") },
  } });
  expect([415, 422]).toContain(unsafe.status());
  const reservation = await page.request.post("/api/reservations", {
    headers, data: { date: "2027-02-20", time: "19:00", people: 2, name: "Pessoa de teste", phone: "27999990000", notes: "" },
  });
  expect([403, 404, 409]).toContain(reservation.status());
  expect((await page.request.post("/api/admin/reset", { headers })).ok()).toBeTruthy();
});

test("formulário de produto publica foto, edita preço e alterna disponibilidade", async ({ page }) => {
  await page.goto("/admin/login");
  await page.getByRole("button", { name: "Entrar na demonstração", exact: true }).click();
  await expect(page).toHaveURL(/\/admin$/);
  expect((await page.request.post("/api/admin/reset", { headers })).ok()).toBeTruthy();
  await page.goto("/admin/cardapio");
  await page.getByRole("button", { name: "Novo produto", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Nome", { exact: true }).fill("Petisco do teste visual");
  await dialog.getByLabel("Categoria", { exact: true }).selectOption({ label: "Petiscos" });
  await dialog.getByLabel("Preço (R$)", { exact: true }).fill("37,90");
  await dialog.getByLabel("Descrição", { exact: true }).fill("Exemplo fictício para verificar o cadastro na demonstração.");
  await dialog.getByLabel("Publicação", { exact: true }).selectOption("published");
  await dialog.getByLabel("Enviar fotografia", { exact: true }).first().setInputFiles("public/images/petiscos.webp");
  await dialog.getByLabel("Descrição da imagem", { exact: false }).first().fill("Imagem ilustrativa de petiscos para teste");
  await dialog.getByRole("button", { name: "Conferir prévia", exact: true }).click();
  await expect(dialog.getByLabel("Prévia do cadastro")).toBeVisible();
  await dialog.getByRole("button", { name: "Salvar", exact: true }).click();
  await expect(dialog).toHaveCount(0);
  const row = page.getByRole("row").filter({ has: page.getByRole("button", { name: "Petisco do teste visual", exact: true }) });
  await expect(row).toBeVisible();
  await row.getByRole("button", { name: "Editar Petisco do teste visual", exact: true }).click();
  await dialog.getByLabel("Preço (R$)", { exact: true }).fill("39,90");
  await dialog.getByRole("button", { name: "Salvar", exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await row.getByRole("button", { name: "Disponibilidade de Petisco do teste visual", exact: true }).click();
  await expect(row.getByRole("button", { name: "Disponibilidade de Petisco do teste visual", exact: true })).toHaveAttribute("aria-pressed", "false");
  await page.goto("/cardapio/petisco-do-teste-visual");
  await expect(page.getByRole("heading", { level: 1, name: "Petisco do teste visual" })).toBeVisible();
  await expect(page.getByText(/39,90/).first()).toBeVisible();
  await expect(page.getByText(/indisponível/i).first()).toBeVisible();
  expect((await page.request.post("/api/admin/reset", { headers })).ok()).toBeTruthy();
});

test("gestão de eventos publica página compartilhável e calendário", async ({ page }) => {
  await page.goto("/admin/login");
  await page.getByRole("button", { name: "Entrar na demonstração", exact: true }).click();
  await expect(page).toHaveURL(/\/admin$/);
  await page.goto("/admin/eventos");
  await page.getByRole("button", { name: "Novo evento", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Nome", { exact: true }).fill("Evento fictício de teste");
  await dialog.getByLabel("Descrição", { exact: true }).fill("Registro exclusivamente demonstrativo do teste automatizado.");
  await dialog.getByLabel("Publicação", { exact: true }).selectOption("published");
  await dialog.getByLabel("Início (horário de Brasília)", { exact: true }).fill("2030-04-15T19:00");
  await dialog.getByLabel("Término (horário de Brasília)", { exact: true }).fill("2030-04-15T22:00");
  await dialog.getByRole("button", { name: "Salvar", exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await page.goto("/eventos/evento-ficticio-de-teste");
  await expect(page.getByRole("heading", { level: 1, name: "Evento fictício de teste" })).toBeVisible();
  const calendar = await page.request.get("/eventos/evento-ficticio-de-teste/calendario");
  expect(calendar.ok()).toBeTruthy();
  expect(calendar.headers()["content-type"]).toContain("text/calendar");
  expect(await calendar.text()).toContain("DTSTART:20300415T220000Z");
  expect((await page.request.post("/api/admin/reset", { headers })).ok()).toBeTruthy();
});

test("promoção em destaque aparece na página inicial e expira automaticamente", async ({ page }) => {
  await page.goto("/admin/login");
  await page.getByRole("button", { name: "Entrar na demonstração", exact: true }).click();
  await expect(page).toHaveURL(/\/admin$/);
  const start = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const end = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  const created = await page.request.post("/api/admin/promotions", { headers, data: {
    title: "Oferta fictícia de teste", product_id: "bba01ff2-84c9-4118-af77-000000000011",
    price_cents: 1800, starts_at: start, ends_at: end, image: null,
    featured: true, status: "published", position: 0,
  } });
  expect(created.ok()).toBeTruthy();
  const promotion = await created.json();
  await page.goto("/");
  const feature = page.getByRole("region", { name: "Promoção em destaque" });
  await expect(feature.getByRole("heading", { name: "Oferta fictícia de teste" })).toBeVisible();
  await expect(feature.getByText("R$ 18,00")).toBeVisible();
  await expect(feature.getByRole("link", { name: /Ver item no cardápio/ })).toHaveAttribute("href", "/cardapio/mandioca-dourada");
  const expired = await page.request.patch(`/api/admin/promotions/${promotion.id}`, { headers, data: {
    starts_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    ends_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  } });
  expect(expired.ok()).toBeTruthy();
  await page.reload();
  await expect(feature).toHaveCount(0);
  expect((await page.request.delete(`/api/admin/promotions/${promotion.id}`, { headers })).ok()).toBeTruthy();
});

test("QR Code de mesa mantém o destino ao alterar o cardápio e exporta arquivos", async ({ page }) => {
  await page.goto("/admin/login");
  await page.getByRole("button", { name: "Entrar na demonstração", exact: true }).click();
  await expect(page).toHaveURL(/\/admin$/);
  await page.goto("/admin/qr-code");
  await page.getByLabel("Identificador de mesa opcional").fill("mesa-03");
  await expect(page.getByLabel("Endereço do QR Code")).toHaveValue(/\/cardapio\?qr=1&mesa=mesa-03$/);
  await expect(page.locator(".qr-print > svg")).toBeVisible();
  await page.getByRole("button", { name: "Salvar modelo" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Modelo salvo" })).toBeVisible();
  const svgDownload = page.waitForEvent("download");
  await page.getByRole("button", { name: "Baixar SVG" }).click();
  expect((await svgDownload).suggestedFilename()).toBe("cardapio-mesa-mesa-03.svg");
  const pngDownload = page.waitForEvent("download");
  await page.getByRole("button", { name: "Baixar PNG" }).click();
  expect((await pngDownload).suggestedFilename()).toBe("cardapio-mesa-mesa-03.png");
});
