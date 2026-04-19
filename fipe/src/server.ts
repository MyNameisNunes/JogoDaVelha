import express from "express";
import axios from "axios";
import path from "path";

type FipeItem = {
  codigo: string;
  nome: string;
};

const LOCAL_FALLBACK = {
  marcas: [
    { codigo: "1", nome: "Chevrolet" },
    { codigo: "2", nome: "Ford" },
    { codigo: "3", nome: "Volkswagen" },
    { codigo: "4", nome: "Toyota" }
  ] as FipeItem[],
  modelos: {
    "1": [
      { codigo: "101", nome: "Onix" },
      { codigo: "102", nome: "Cruze" }
    ],
    "2": [
      { codigo: "201", nome: "Ka" },
      { codigo: "202", nome: "Ranger" }
    ],
    "3": [
      { codigo: "301", nome: "Gol" },
      { codigo: "302", nome: "T-Cross" }
    ],
    "4": [
      { codigo: "401", nome: "Corolla" },
      { codigo: "402", nome: "Yaris" }
    ]
  } as Record<string, FipeItem[]>,
  anos: {
    "1:101": [
      { codigo: "2022-1", nome: "2022 Gasolina" },
      { codigo: "2023-1", nome: "2023 Gasolina" }
    ],
    "1:102": [
      { codigo: "2020-1", nome: "2020 Gasolina" },
      { codigo: "2021-1", nome: "2021 Gasolina" }
    ],
    "2:201": [
      { codigo: "2019-1", nome: "2019 Gasolina" },
      { codigo: "2020-1", nome: "2020 Gasolina" }
    ],
    "2:202": [
      { codigo: "2022-1", nome: "2022 Diesel" },
      { codigo: "2023-1", nome: "2023 Diesel" }
    ],
    "3:301": [
      { codigo: "2018-1", nome: "2018 Gasolina" },
      { codigo: "2019-1", nome: "2019 Gasolina" }
    ],
    "3:302": [
      { codigo: "2022-1", nome: "2022 Flex" },
      { codigo: "2023-1", nome: "2023 Flex" }
    ],
    "4:401": [
      { codigo: "2022-1", nome: "2022 Flex" },
      { codigo: "2023-1", nome: "2023 Flex" }
    ],
    "4:402": [
      { codigo: "2021-1", nome: "2021 Flex" },
      { codigo: "2022-1", nome: "2022 Flex" }
    ]
  } as Record<string, FipeItem[]>,
  precos: {
    "1:101:2022-1": "R$ 72.900,00",
    "1:101:2023-1": "R$ 79.900,00",
    "1:102:2020-1": "R$ 96.500,00",
    "1:102:2021-1": "R$ 103.700,00",
    "2:201:2019-1": "R$ 48.900,00",
    "2:201:2020-1": "R$ 53.200,00",
    "2:202:2022-1": "R$ 214.000,00",
    "2:202:2023-1": "R$ 228.600,00",
    "3:301:2018-1": "R$ 44.400,00",
    "3:301:2019-1": "R$ 47.900,00",
    "3:302:2022-1": "R$ 132.000,00",
    "3:302:2023-1": "R$ 141.800,00",
    "4:401:2022-1": "R$ 145.300,00",
    "4:401:2023-1": "R$ 156.000,00",
    "4:402:2021-1": "R$ 92.700,00",
    "4:402:2022-1": "R$ 99.900,00"
  } as Record<string, string>
};

const app = express();
const port = Number(process.env.PORT ?? 3000);

app.use(express.static("views"));

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : String(error);

const requestWithFallback = async <T>(urls: string[]): Promise<T> => {
  let lastError: unknown;

  for (const url of urls) {
    try {
      const response = await axios.get<T>(url, { timeout: 8000 });
      return response.data;
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError;
};

const normalizeItems = (items: unknown[]): FipeItem[] =>
  items
    .map((item) => {
      const data = item as Record<string, unknown>;
      const codigo = data.codigo ?? data.valor ?? data.id;
      const nome = data.nome ?? data.label ?? data.modelo ?? data.name;

      if (!codigo || !nome) {
        return null;
      }

      return { codigo: String(codigo), nome: String(nome) };
    })
    .filter((item): item is FipeItem => Boolean(item));

app.get("/", (_req, res) => {
  res.sendFile(path.resolve(process.cwd(), "views", "index.html"));
});

app.get("/marcas", async (_req, res) => {
  try {
    const data = await requestWithFallback<unknown[]>([
      "https://parallelum.com.br/fipe/api/v1/carros/marcas",
      "http://parallelum.com.br/fipe/api/v1/carros/marcas",
      "https://brasilapi.com.br/api/fipe/marcas/v1/carros",
      "http://brasilapi.com.br/api/fipe/marcas/v1/carros"
    ]);

    const marcas = normalizeItems(data);
    if (marcas.length > 0) {
      return res.json(marcas);
    }
    return res.json(LOCAL_FALLBACK.marcas);
  } catch (error) {
    console.warn("Fallback local em /marcas:", getErrorMessage(error));
    return res.json(LOCAL_FALLBACK.marcas);
  }
});

app.get("/modelos/:marcaId", async (req, res) => {
  const { marcaId } = req.params;

  try {
    const parallelumData = await requestWithFallback<Record<string, unknown>>([
      `https://parallelum.com.br/fipe/api/v1/carros/marcas/${marcaId}/modelos`,
      `http://parallelum.com.br/fipe/api/v1/carros/marcas/${marcaId}/modelos`
    ]);

    if (Array.isArray(parallelumData.modelos)) {
      return res.json({ modelos: normalizeItems(parallelumData.modelos as unknown[]) });
    }

    throw new Error("Formato inesperado de modelos.");
  } catch (_error) {
    try {
      const brasilApiData = await requestWithFallback<unknown[]>([
        `https://brasilapi.com.br/api/fipe/veiculos/v1/carros/${marcaId}`,
        `http://brasilapi.com.br/api/fipe/veiculos/v1/carros/${marcaId}`
      ]);

      const modelos = normalizeItems(brasilApiData);
      if (modelos.length > 0) {
        return res.json({ modelos });
      }
      return res.json({ modelos: LOCAL_FALLBACK.modelos[marcaId] ?? [] });
    } catch (error) {
      console.warn("Fallback local em /modelos:", getErrorMessage(error));
      return res.json({ modelos: LOCAL_FALLBACK.modelos[marcaId] ?? [] });
    }
  }
});

app.get("/anos/:marcaId/:modeloId", async (req, res) => {
  const { marcaId, modeloId } = req.params;

  try {
    const parallelumData = await requestWithFallback<unknown[]>([
      `https://parallelum.com.br/fipe/api/v1/carros/marcas/${marcaId}/modelos/${modeloId}/anos`,
      `http://parallelum.com.br/fipe/api/v1/carros/marcas/${marcaId}/modelos/${modeloId}/anos`
    ]);

    const anos = normalizeItems(parallelumData);
    if (anos.length > 0) {
      return res.json(anos);
    }
    return res.json(LOCAL_FALLBACK.anos[`${marcaId}:${modeloId}`] ?? []);
  } catch (_error) {
    try {
      const brasilApiData = await requestWithFallback<unknown[]>([
        `https://brasilapi.com.br/api/fipe/veiculos/v1/carros/${marcaId}/${modeloId}`,
        `http://brasilapi.com.br/api/fipe/veiculos/v1/carros/${marcaId}/${modeloId}`
      ]);

      const anos = normalizeItems(brasilApiData);
      if (anos.length > 0) {
        return res.json(anos);
      }
      return res.json(LOCAL_FALLBACK.anos[`${marcaId}:${modeloId}`] ?? []);
    } catch (error) {
      console.warn("Fallback local em /anos:", getErrorMessage(error));
      return res.json(LOCAL_FALLBACK.anos[`${marcaId}:${modeloId}`] ?? []);
    }
  }
});

app.get("/preco/:marcaId/:modeloId/:anoId", async (req, res) => {
  const { marcaId, modeloId, anoId } = req.params;

  try {
    const parallelumData = await requestWithFallback<Record<string, unknown>>([
      `https://parallelum.com.br/fipe/api/v1/carros/marcas/${marcaId}/modelos/${modeloId}/anos/${anoId}`,
      `http://parallelum.com.br/fipe/api/v1/carros/marcas/${marcaId}/modelos/${modeloId}/anos/${anoId}`
    ]);

    if (parallelumData.Valor) {
      return res.json({ preco: String(parallelumData.Valor) });
    }

    throw new Error("Formato inesperado de preco.");
  } catch (_error) {
    try {
      const brasilApiData = await requestWithFallback<Record<string, unknown>>([
        `https://brasilapi.com.br/api/fipe/veiculo/v1/carros/${marcaId}/${modeloId}/${anoId}`,
        `http://brasilapi.com.br/api/fipe/veiculo/v1/carros/${marcaId}/${modeloId}/${anoId}`
      ]);

      const preco = brasilApiData.valor ?? brasilApiData.Valor;

      if (!preco) {
        throw new Error("Preco nao encontrado.");
      }

      return res.json({ preco: String(preco) });
    } catch (error) {
      console.warn("Fallback local em /preco:", getErrorMessage(error));
      const localPreco = LOCAL_FALLBACK.precos[`${marcaId}:${modeloId}:${anoId}`];
      if (localPreco) {
        return res.json({ preco: localPreco });
      }
      return res.status(404).json({ error: "Nao foi possivel consultar o preco." });
    }
  }
});

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
