export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}

export async function request<T>(url: string): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(url);

    if (!response.ok) {
      return {
        data: null,
        error: `Falha ao consultar ${url}: ${response.status}`,
      };
    }

    const data = (await response.json()) as T;
    return { data, error: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    return {
      data: null,
      error: message,
    };
  }
}
