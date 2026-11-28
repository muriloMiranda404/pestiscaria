export class StoreError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
    this.name = "StoreError";
  }
}

export function databaseFailure(code?: string): never {
  const errors: Record<string, [number, string]> = {
    "23503": [409, "O registro está vinculado a outro cadastro. Confira a categoria ou o produto selecionado."],
    "23505": [409, "Já existe um cadastro com esse identificador."],
    "23514": [422, "Confira os dados, preços, datas e horários informados."],
    "23502": [422, "Preencha os campos obrigatórios."],
    "42501": [403, "Acesso restrito."],
    PT403: [403, "O recurso não está disponível."],
    PT404: [404, "O cadastro não foi encontrado."],
    PT422: [422, "Confira os dados informados."],
  };
  const [status, message] = errors[code ?? ""] ?? [503, "O banco está indisponível. Tente novamente em instantes."];
  throw new StoreError(status, message);
}
