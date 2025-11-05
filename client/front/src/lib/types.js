/**
 * @typedef {"immediate"|"preventive"} SuggestionCategory
 *
 * @typedef {Object} Suggestion
 * @property {string} title
 * @property {SuggestionCategory} category
 * @property {string} content_md
 * @property {number} rank
 *
 * @typedef {Object} InferResponse
 * @property {string} id
 * @property {string} label
 * @property {number} confidence      // 0..1
 * @property {number} severity_percent // 0..100
 * @property {"low"|"medium"|"high"} severity_band
 * @property {string=} gradcam_url
 * @property {string} captured_at     // ISO
 * @property {number=} lat
 * @property {number=} lon
 * @property {Suggestion[]=} suggestions
 *
 * @typedef {Object} Me
 * @property {string} name
 * @property {string=} avatar_url
 *
 * @typedef {InferResponse} Detection
 */
