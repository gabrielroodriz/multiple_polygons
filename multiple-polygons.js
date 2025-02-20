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
