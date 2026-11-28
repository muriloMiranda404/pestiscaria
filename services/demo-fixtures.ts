import type { Catalog, Photo, Product } from "@/types/domain";
import { emptyCatalog } from "@/services/publication";

const id = (n: number) => `bba01ff2-84c9-4118-af77-${String(n).padStart(12, "0")}`;
const picture = (name: string, alt: string): Photo => ({ src: `/images/${name}.webp`, alt, illustrative: true });

export function demoFixtures(now = new Date()): Catalog {
  const catalog = emptyCatalog(true);
  catalog.categories = [
    { id: id(1), name: "Porções", slug: "porcoes", position: 0, status: "published" },
    { id: id(2), name: "Petiscos", slug: "petiscos", position: 1, status: "published" },
    { id: id(3), name: "Bebidas", slug: "bebidas", position: 2, status: "published" },
  ];
  const porcoes = picture("porcoes", "Composição gastronômica ilustrativa de uma porção para compartilhar");
  const petiscos = picture("petiscos", "Fotografia ilustrativa de petiscos à mesa");
  const bebidas = picture("bebidas", "Fotografia ilustrativa de uma bebida gelada");
  const mesa = picture("mesa", "Composição ilustrativa de mesa de petiscaria");
  const make = (n: number, category: number, name: string, slug: string, description: string, price: number, image: Photo): Product => ({
    id: id(10 + n), name, slug, category_id: id(category), description, image, images: [], price_cents: price,
    variants: [], addons: [], ingredients: "", allergens: "", serves: "", available: true, featured: n < 4, position: n, status: "published",
  });
  catalog.products = [
    { ...make(1, 1, "Mandioca dourada", "mandioca-dourada", "Porção de mandioca crocante, servida para dividir.", 3200, porcoes),
      serves: "2 pessoas", variants: [{ name: "Meia porção", price_cents: 2000 }, { name: "Porção inteira", price_cents: 3200 }], addons: [{ name: "Molho da casa", price_cents: 300 }] },
    make(2, 2, "Bolinho de mandioca", "bolinho-de-mandioca", "Bolinhos dourados com casquinha delicada.", 2800, petiscos),
    make(3, 3, "Cerveja pilsen", "cerveja-pilsen", "Cerveja clara servida gelada.", 1200, bebidas),
    { ...make(4, 1, "Batata rústica", "batata-rustica", "Batatas em gomos para compartilhar à mesa.", 2900, porcoes), available: false },
  ];
  const next = new Date(now);
  next.setUTCDate(next.getUTCDate() + 7);
  next.setUTCHours(23, 0, 0, 0);
  catalog.events = [{
    id: id(31), title: "Roda de samba à mesa", slug: "roda-de-samba-a-mesa", description: "Evento fictício para conhecer o funcionamento da agenda.",
    image: mesa, starts_at: next.toISOString(), ends_at: null, artist: "", fee_cents: null,
    notes: "", status: "published", position: 0, featured: true,
  }];
  catalog.gallery = [
    { id: id(41), image: mesa, category: "À mesa", instagram_url: "", status: "published", position: 0 },
    { id: id(42), image: porcoes, category: "Porções", instagram_url: "", status: "published", position: 1 },
    { id: id(43), image: bebidas, category: "Bebidas", instagram_url: "", status: "published", position: 2 },
    { id: id(44), image: petiscos, category: "Petiscos", instagram_url: "", status: "published", position: 3 },
  ];
  return catalog;
}
