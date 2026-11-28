import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const widths = [320, 375, 390, 430, 768, 1024, 1440, 1920];

for (const width of widths) {
  test(`início e cardápio cabem em ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    for (const path of ["/", "/cardapio"]) {
      const response = await page.goto(path);
      expect(response?.status()).toBe(200);
      await expect(page.locator("h1")).toBeVisible();
      await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
      const brokenImages = await page.locator("img").evaluateAll((images) => images.filter(image => {
        const picture = image as HTMLImageElement;
        return picture.complete && picture.naturalWidth === 0;
      }).map(image => (image as HTMLImageElement).src));
      expect(brokenImages).toEqual([]);
      if ([390, 1440].includes(width)) {
        await page.screenshot({ path: `test-results/${path === "/" ? "inicio" : "cardapio"}-${width}.png`, fullPage: true });
      }
    }
  });
}

test("cardápio pesquisa sem acento, filtra disponibilidade e abre detalhes", async ({ page }) => {
  await page.goto("/cardapio");
  const search = page.getByRole("searchbox", { name: "Buscar no cardápio" });
  await search.fill("rustica");
  await expect(page.getByRole("heading", { name: "Batata rústica", exact: true })).toBeVisible();
  await page.getByLabel("Só disponíveis").check();
  await expect(page.getByRole("heading", { name: "Nenhum item encontrado" })).toBeVisible();
  await page.getByRole("button", { name: "Limpar filtros" }).click();
  await page.getByRole("button", { name: "Bebidas", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Cerveja pilsen", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Mandioca dourada", exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Todas", exact: true }).click();
  await search.fill("mandioca dourada");
  await page.locator('a[href="/cardapio/mandioca-dourada"]').first().click();
  await expect(page).toHaveURL(/\/cardapio\/mandioca-dourada$/);
  await expect(page.getByRole("heading", { level: 1, name: "Mandioca dourada" })).toBeVisible();
  await expect(page.getByText("Meia porção", { exact: false })).toBeVisible();
});

test("rotas públicas e funções desativadas retornam estados corretos", async ({ page, request }) => {
  for (const path of ["/sobre", "/galeria", "/eventos", "/contato", "/privacidade"]) {
    const response = await page.goto(path);
    expect(response?.status()).toBe(200);
    await expect(page.locator("h1")).toHaveCount(1);
  }
  for (const path of ["/pedidos", "/reservas", "/cardapio/item-inexistente", "/eventos/evento-inexistente"]) {
    expect((await request.get(path)).status()).toBe(404);
  }
  const robots = await request.get("/robots.txt");
  expect(await robots.text()).toContain("Disallow: /");
  await page.goto("/");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  expect(await page.locator('a[href^="https://wa.me/"]').count()).toBe(0);
  await page.goto("/contato");
  await expect(page.locator('a[href^="https://www.google.com/maps/search/"]').first()).toBeVisible();
  expect(await page.locator("iframe").count()).toBe(0);
});

test("páginas representativas passam regras automáticas WCAG A e AA", async ({ page }) => {
  for (const path of ["/", "/cardapio", "/contato", "/admin/login"]) {
    await page.goto(path);
    await page.emulateMedia({ reducedMotion: "reduce" });
    const audit = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
    expect(audit.violations, `${path}\n${audit.violations.map(v => `${v.id}: ${v.nodes.map(n => n.target.join(" ")).join(", ")}`).join("\n")}`).toEqual([]);
  }
});

test("menu móvel e galeria funcionam com teclado", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Mais um motivo para vir." })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Entre sabores e bons encontros." })).toBeVisible();
  await page.getByRole("button", { name: "Abrir menu" }).click();
  const navigation = page.getByRole("dialog", { name: "Lucrécio" });
  await expect(navigation).toBeVisible();
  await navigation.getByRole("link", { name: "Galeria" }).click();
  await expect(page).toHaveURL(/\/galeria$/);
  await expect(navigation).toHaveCount(0);
  await page.getByRole("button", { name: /Ampliar/ }).first().click();
  const lightbox = page.getByRole("dialog");
  await expect(lightbox).toBeVisible();
  await page.keyboard.press("ArrowRight");
  await expect(lightbox).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(lightbox).toHaveCount(0);
});
