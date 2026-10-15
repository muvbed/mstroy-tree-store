export type FetchData<T> = {data: T, error: null} | {data: null, error: string};

export const getData = async <T>(
    url: string, 
    validate: (data: unknown) => data is T,
    signal?: AbortSignal
): Promise<FetchData<T>> => {
    try {
        const response = await fetch(url, { signal });

        if (!response.ok) {
            return {data: null, error: `Ошибка HTTP ${response.status}`};
        }

        const data: unknown = await response.json();

        if (!validate(data)) {
            return {data: null, error: 'Ошибка валидации данных'};
        }

        return {data, error: null};
    } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
            return { data: null, error: 'Запрос отменен' };
        }

        const errorMessage = error instanceof Error ? error.message : String(error);

        return {data: null, error: `Ошибка при выполнении запроса: ${errorMessage}`};
    }
}
