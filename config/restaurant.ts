import type { Settings } from "@/types/domain";

export const defaults: Settings = {
  name: "Lucrécio Petiscaria", logo: "", primary_color: "#A94026", accent_color: "#E8AC61",
  phone: "(27) 99859-4175", whatsapp: "", whatsapp_confirmed: false,
  instagram: "https://www.instagram.com/lucrecio_petiscaria/", street: "Rua João Tersi, 216",
  district: "Canivete", city: "Linhares", state: "ES", postal_code: "29909-030",
  reference: "Na rua da pracinha do bairro Canivete.", maps_url: "",
  about: "No bairro Canivete, em Linhares, a Lucrécio Petiscaria reúne porções, petiscos e cerveja gelada em um ambiente familiar. Uma mesa para dividir com quem você gosta.",
  announcement: "", announcement_until: null, hours: [], special_hours: [],
  seo_title: "Lucrécio Petiscaria | Restaurante no Canivete, Linhares",
  seo_description: "Conheça a Lucrécio Petiscaria, no bairro Canivete em Linhares, ES. Consulte o cardápio, confira novidades e veja como chegar.",
  cnpj: "40.704.943/0001-10", show_cnpj: false, orders_enabled: false,
  reservations_enabled: false, analytics_enabled: false, pickup_enabled: false,
  delivery_enabled: false, maintenance: false,
};
export const timeZone = "America/Sao_Paulo";
