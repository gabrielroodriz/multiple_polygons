# Gerando Imagens de Múltiplos Polígonos com Google Earth Engine: Um Guia Prático

## Introdução

O Google Earth Engine (GEE) é uma plataforma poderosa para análise e visualização de dados geoespaciais em escala global. Neste artigo, vou compartilhar uma solução prática para gerar imagens com múltiplos polígonos coloridos utilizando dados do satélite Sentinel-2, uma ferramenta que pode ser extremamente útil para análises ambientais, agrícolas e urbanas.

## Por que Google Earth Engine?

O GEE oferece algumas vantagens significativas para processamento de dados geoespaciais:

-   Acesso gratuito a um vasto catálogo de imagens de satélite
-   Processamento em nuvem, eliminando a necessidade de hardware potente
-   API JavaScript intuitiva para manipulação de dados
-   Capacidade de processar grandes volumes de dados rapidamente

## Entendendo o Objetivo

Agora que entendemos as motivações pelas quais vamos utilizar o Google Earth Engine, nosso script terá como finalidade:

1. Gerar uma imagem com múltiplos polígonos em uma área específica
2. Diferenciar cada polígono com cores distintas
3. Utilizar imagens de alta qualidade do Sentinel-2
4. Exportar o resultado final em um formato utilizável

## Implementação Passo a Passo

### 1. Definindo os Polígonos

Para começar, precisamos definir as coordenadas dos polígonos que queremos visualizar. Cada polígono é definido por uma série de pontos (coordenadas) que, quando conectados, formam a área desejada:

```js
var polygonCoordinates = [
    [
        [-47.21671, -22.97828],
        [-47.21671, -22.96828],
        [-47.20671, -22.96828],
        [-47.20671, -22.97828],
        [-47.21671, -22.97828],
    ],
    // ... outros polígonos
];

var borderColors = ["B3B3B3", "12B5E8", "F3933A", "F46A94", "A45BC9"];
```

Cada conjunto de coordenadas representa um polígono diferente, e uma maneira simples para diferencia-los, vamos adotar uma cor para cada polígono, conforme foi definido no array `borderColors`.

### 2. Criando a Coleção de Features

No Google Earth Engine, existe um conceito chamado `FeatureCollection`. Uma coleção de objetos geográficos.

Por que usar o FeatureCollection?

-   Permite trabalhar com múltiplos objetos geográficos de forma eficiente
-   Facilita operações em grupo sobre todos os polígonos
-   Otimiza o processamento dos dados

```js
// Vários polígonos individuais
var polygons = [
  Polígono1,  // [-47.21671, -22.97828], ...
  Polígono2,  // [-47.20671, -22.96828], ...
  Polígono3   // [-47.19671, -22.97828], ...
];

// FeatureCollection
var allPolygons = ee.FeatureCollection([...]);
/*
  +-------------------------+
  |     FeatureCollection   |
  |    +----+  +----+      |
  |    |Pol1|  |Pol2|      |
  |    +----+  +----+      |
  |        +----+          |
  |        |Pol3|          |
  |        +----+          |
  +-------------------------+
*/

// Quando aplicamos o buffer
var bufferedArea = allPolygons.geometry().buffer(2000);
/*
  +---------------------------+
  |      Área com Buffer      |
  |   +-------------------+   |
  |   |  +----+  +----+  |   |
  |   |  |Pol1|  |Pol2|  |   |
  |   |  +----+  +----+  |   |
  |   |      +----+      |   |
  |   |      |Pol3|      |   |
  |   |      +----+      |   |
  |   +-------------------+   |
  +---------------------------+
*/
```

Aqui está como transformamos nossas coordenadas em uma `FeatureCollection`:

```js
var polygons = polygonCoordinates.map(function (coords) {
    return ee.Geometry.Polygon([coords]);
});

var allPolygons = ee.FeatureCollection(
    polygons.map(function (poly) {
        return ee.Feature(poly);
    })
);
```

### 3. Entendendo e Utilizando Imagens do Sentinel-2

O Sentinel-2 é um satélite que captura imagens da Terra em diferentes comprimentos de onda da luz. Cada uma dessas capturas é chamada de "banda". O satélite tem 13 bandas no total, cada uma servindo a um propósito específico:

B1: Aerossol (443 nm)
B2: Azul (490 nm)
B3: Verde (560 nm)
B4: Vermelho (665 nm)
B5-B12: Outras bandas especializadas

Para criar uma imagem que pareça natural aos nossos olhos, usamos três bandas específicas:

B4 (Vermelho)
B3 (Verde)
B2 (Azul)

Aqui está como selecionamos e configuramos essas imagens:

```js
var s2 = ee
    .ImageCollection("COPERNICUS/S2_SR_HARMONIZED")
    .filterBounds(bufferedArea)
    .filterDate("2024-01-01", "2024-02-18")
    .first();

var rgbImage = s2.select(["B4", "B3", "B2"]);
var visualizationParams = {
    bands: ["B4", "B3", "B2"],
    min: 100, // Define o valor mínimo de brilho
    max: 2000, // Define o valor máximo de brilho
    gamma: 1.4, // Ajusta o contraste da imagem
};
```

### 4. Criando as Bordas Coloridas

Para desenhar os polígonos sobre a imagem do satélite, precisamos criar uma imagem vazia e então "pintar" nossas bordas sobre ela:

```js
// Cria uma imagem vazia para desenhar
var empty = ee.Image().byte();

// Desenha cada polígono com sua cor específica
var borders = polygons.map(function (polygon, index) {
    return empty
        .paint({
            featureCollection: ee.FeatureCollection([ee.Feature(polygon)]),
            color: 1,
            width: 3, // Espessura da borda em pixels
        })
        .visualize({
            palette: [borderColors[index]],
        });
});
```

### 5. Combinando os Elementos

O passo final é combinar a imagem base com as bordas coloridas:

```js
// Prepara a imagem base com os parâmetros de visualização
var baseImage = rgbImage.visualize(visualizationParams);

// Combina todas as bordas em uma única camada
var combinedBorders = ee.ImageCollection(borders).mosaic();

// Junta a imagem base com as bordas
var finalImage = ee.ImageCollection([baseImage, combinedBorders]).mosaic();
```

## Considerações Importantes

Ao trabalhar com o Google Earth Engine, tenha em mente:

1. **Resolução das Imagens:**
    - O Sentinel-2 oferece resolução de 10m por pixel
    - Escolha a escala adequada para sua análise
2. **Limitações da Plataforma:**
    - Existe um limite de processamento
    - Alguns processos podem demorar mais em áreas muito grandes
3. **Otimização:**
    - Sempre teste em áreas menores primeiro
    - Ajuste os parâmetros conforme necessário

## Conclusão

O Google Earth Engine é uma ferramenta incrivelmente poderosa para análise geoespacial. Com este script, você pode criar visualizações profissionais de áreas geográficas específicas, seja para uso acadêmico, profissional ou pesquisa.

O código completo está disponível abaixo, e encorajo você a experimentar, adaptar e criar suas próprias visualizações!

## Código Completo

```js
var polygonCoordinates = [
    [
        [-47.21671, -22.97828],
        [-47.21671, -22.96828],
        [-47.20671, -22.96828],
        [-47.20671, -22.97828],
        [-47.21671, -22.97828],
    ],
    [
        [-47.20671, -22.96828],
        [-47.20671, -22.95828],
        [-47.19671, -22.95828],
        [-47.19671, -22.96828],
        [-47.20671, -22.96828],
    ],
    [
        [-47.19671, -22.97828],
        [-47.19671, -22.96828],
        [-47.18671, -22.96828],
        [-47.18671, -22.97828],
        [-47.19671, -22.97828],
    ],
];

var borderColors = ["B3B3B3", "12B5E8", "F3933A", "F46A94", "A45BC9"];

var polygons = polygonCoordinates.map(function (coords) {
    return ee.Geometry.Polygon([coords]);
});

var allPolygons = ee.FeatureCollection(
    polygons.map(function (poly) {
        return ee.Feature(poly);
    })
);

var bufferedArea = allPolygons.geometry().buffer(3000);

var s2 = ee
    .ImageCollection("COPERNICUS/S2_SR_HARMONIZED")
    .filterBounds(bufferedArea)
    .filterDate("2024-01-01", "2024-02-18")
    .first();

var rgbImage = s2.select(["B4", "B3", "B2"]);

var visualizationParams = {
    bands: ["B4", "B3", "B2"],
    min: 100,
    max: 2000,
    gamma: 1.4,
};

var empty = ee.Image().byte();

var borders = polygons.map(function (polygon, index) {
    return empty
        .paint({
            featureCollection: ee.FeatureCollection([ee.Feature(polygon)]),
            color: 1,
            width: 3,
        })
        .visualize({
            palette: [borderColors[index]],
        });
});

var baseImage = rgbImage.visualize(visualizationParams);
var combinedBorders = ee.ImageCollection(borders).mosaic();
var finalImage = ee.ImageCollection([baseImage, combinedBorders]).mosaic();

Map.addLayer(finalImage, {}, "Image with Colored Borders");
Map.centerObject(bufferedArea, 12);

Export.image.toDrive({
    image: finalImage,
    description: "Image_With_Multiple_Polygons",
    region: bufferedArea.bounds(),
    scale: 10,
    maxPixels: 1e13,
    crs: "EPSG:4326",
});
```

## Sobre o Autor

Gabriel Souza é um desenvolvedor mobile especializado em React Native com Expo, apaixonado por tecnologia e sempre em busca de novos desafios e aprendizados na área de desenvolvimento de software.
