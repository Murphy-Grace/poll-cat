// Identity verified against these NGA profiles on 2026-11-03; no guessed image URLs.
export const GOVERNOR_PORTRAITS: Record<string, { url: string; source: string; credit: string }> = {
  'katie hobbs': { url: 'https://www.nga.org/wp-content/uploads/2023/01/governor-katie-hobbs-scaled.jpeg', source: 'https://www.nga.org/governors/arizona/', credit: 'National Governors Association · Katie Hobbs' },
  'sarah huckabee sanders': { url: 'https://www.nga.org/wp-content/uploads/2023/01/Governor-Headshot-sanders-e1756131825437.jpg', source: 'https://www.nga.org/governors/arkansas/', credit: 'National Governors Association · Sarah Huckabee Sanders' },
}
// Official congressional portraits; identity and public-domain license checked
// against the linked Commons file descriptions on 2026-11-03.
Object.assign(GOVERNOR_PORTRAITS, {
  'doug jones': { url: 'https://commons.wikimedia.org/wiki/Special:FilePath/Senator%20Doug%20Jones%20official%20photo.jpg?width=250', source: 'https://commons.wikimedia.org/wiki/File:Senator_Doug_Jones_official_photo.jpg', credit: 'U.S. Senate Photographic Studio / Renee Bouchard · Public domain' },
  'tommy tuberville': { url: 'https://commons.wikimedia.org/wiki/Special:FilePath/Tommy%20Tuberville%20official%20portrait.jpg?width=250', source: 'https://commons.wikimedia.org/wiki/File:Tommy_Tuberville_official_portrait.jpg', credit: 'United States Senate Photographic Studio · Public domain' },
})
