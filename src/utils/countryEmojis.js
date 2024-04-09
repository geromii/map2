import emojis from '/public/emojis.json';

export function getCountryEmoji(countryName) {
  const country = emojis.find(([name]) => name === countryName);
  return country ? country[1] : null;
}
