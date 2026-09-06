const ICONOS_POR_CATEGORIA = {
  bank: '🏦', school: '🏫', university: '🎓', hospital: '🏥', pharmacy: '💊',
  restaurant: '🍽️', cafe: '☕', supermarket: '🛒', park: '🌳', plaza: '⛲',
  church: '⛪', museum: '🏛️', library: '📚', police: '👮', fire_station: '🚒',
  fuel: '⛽', parking: '🅿️', bus_station: '🚌', hotel: '🏨', cinema: '🎬',
  theatre: '🎭', sports_centre: '⚽', government: '🏛️', post_office: '📮',
  marketplace: '🏪', atm: '🏧', doctors: '👨‍⚕️', dentist: '🦷', veterinary: '🐾',
  place_of_worship: '🙏', mall: '🛍️', aerodrome: '✈️', industrial: '🏭',
  residential: '🏘️',
};

export function obtenerIconoCategoria(categoria) {
  return ICONOS_POR_CATEGORIA[categoria] || '📍';
}