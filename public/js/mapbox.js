/* eslint-disable */

const displayMap = (locations) => {
  mapboxgl.accessToken =
    'pk.eyJ1Ijoic2FjaGluMTAwNCIsImEiOiJjazlmeTYzcXMwYXhhM2ZrY2lxeWJ0bmQ2In0.eCU5o633Ij45NqmnFTqBRQ';

  var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/sachin1004/ck9fyg4jh14vc1ik6qq2nnvae',
    scrollZoom: false,
    // center: [-118.113491, 34.111745],
    // zoom: 10,
    // interactive: false,
  });

  const bounds = new mapboxgl.LngLatBounds();

  locations.forEach((loc) => {
    //create marker
    const el = document.createElement('div');
    el.className = 'marker';
    // add marker
    new mapboxgl.Marker({
      element: el,
      anchor: 'bottom',
    })
      .setLngLat(loc.coordinates)
      .addTo(map);

    new mapboxgl.Popup({
      offset: 30,
    })
      .setLngLat(loc.coordinates)
      .setHTML(`<p>Day  ${loc.day}: ${loc.description}</p>`)
      .addTo(map);
    // extend map bound to include current location
    bounds.extend(loc.coordinates);
  });
  map.fitBounds(bounds, {
    padding: {
      top: 200,
      bottom: 150,
      left: 100,
      right: 100,
    },
  });
};

export default displayMap;
