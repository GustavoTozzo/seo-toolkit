// Mesmo checklist prático usado em scripts/structured_data_validator.py — mantenha os
// dois em sincronia se alterar um dos dois.

export const SCHEMA_RULES: Record<string, { required: string[]; recommended: string[] }> = {
  Product: { required: ["name", "image"], recommended: ["description", "offers", "aggregateRating", "brand", "sku"] },
  Article: { required: ["headline", "image", "datePublished"], recommended: ["author", "dateModified", "publisher"] },
  BlogPosting: { required: ["headline", "image", "datePublished"], recommended: ["author", "dateModified", "publisher"] },
  NewsArticle: { required: ["headline", "image", "datePublished"], recommended: ["author", "dateModified", "publisher"] },
  FAQPage: { required: ["mainEntity"], recommended: [] },
  BreadcrumbList: { required: ["itemListElement"], recommended: [] },
  Organization: { required: ["name", "url"], recommended: ["logo", "sameAs", "contactPoint"] },
  LocalBusiness: {
    required: ["name", "address"],
    recommended: ["telephone", "openingHoursSpecification", "geo", "priceRange"],
  },
  Recipe: {
    required: ["name", "image", "recipeIngredient", "recipeInstructions"],
    recommended: ["author", "prepTime", "cookTime", "nutrition", "aggregateRating"],
  },
  Event: {
    required: ["name", "startDate", "location"],
    recommended: ["endDate", "offers", "performer", "eventStatus"],
  },
  Review: { required: ["itemReviewed", "author", "reviewRating"], recommended: [] },
  VideoObject: {
    required: ["name", "description", "thumbnailUrl", "uploadDate"],
    recommended: ["duration", "contentUrl", "embedUrl"],
  },
};

export type SchemaBlockResult = {
  schemaType: string;
  covered: boolean;
  missingRequired: string[];
  missingRecommended: string[];
  status: "OK" | "Atenção" | "Erro" | "Tipo não coberto pelo checklist";
};

export function* iterSchemaObjects(payload: unknown): Generator<unknown> {
  if (Array.isArray(payload)) {
    for (const item of payload) yield* iterSchemaObjects(item);
    return;
  }
  if (payload && typeof payload === "object") {
    const obj = payload as Record<string, unknown>;
    if (Array.isArray(obj["@graph"])) {
      for (const item of obj["@graph"] as unknown[]) yield* iterSchemaObjects(item);
      return;
    }
    yield obj;
  }
}

export function evaluateBlock(obj: Record<string, unknown>): SchemaBlockResult {
  const rawType = obj["@type"];
  const schemaType = Array.isArray(rawType) ? rawType.join(", ") : String(rawType ?? "Desconhecido");

  const rules = SCHEMA_RULES[schemaType];
  if (!rules) {
    return { schemaType, covered: false, missingRequired: [], missingRecommended: [], status: "Tipo não coberto pelo checklist" };
  }

  const missingRequired = rules.required.filter((field) => !(field in obj));
  const missingRecommended = rules.recommended.filter((field) => !(field in obj));

  const status = missingRequired.length > 0 ? "Erro" : missingRecommended.length > 0 ? "Atenção" : "OK";

  return { schemaType, covered: true, missingRequired, missingRecommended, status };
}
