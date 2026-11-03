import type { PollingDetail, ForecastRace } from "./polling"
import type { SenateResultRace } from "./results"

export type SenateCandidate = {
  name: string
  party: string
  className: string
  writeIn: boolean
  source: string
  photo: { url: string; source: string; credit: string } | null
}
export type SenateDirectoryEntry = {
  state: string
  seat: "REG" | "SP"
  source: string
  checkedOn: string
  candidates: SenateCandidate[]
}
// Editorial snapshot: only the 2026 GENERAL-election sections of the linked
// state pages. Includes explicitly listed write-ins; excludes withdrawn/primary
// candidates. Never replace ballot identities with polling/forecast scenarios.
export const SENATE_DIRECTORY: Record<string, SenateDirectoryEntry> = {
  "AL": {
    "state": "Alabama",
    "seat": "REG",
    "source": "https://ballotpedia.org/United_States_Senate_election_in_Alabama,_2026",
    "checkedOn": "2026-11-03",
    "candidates": [
      {
        "name": "Barry Moore",
        "party": "Republican",
        "className": "rep",
        "writeIn": false,
        "source": "https://ballotpedia.org/United_States_Senate_election_in_Alabama,_2026",
        "photo": {
          "url": "https://commons.wikimedia.org/wiki/Special:FilePath/Barry%20Moore%20117th%20U.S%20Congress.jpg?width=240",
          "source": "https://commons.wikimedia.org/wiki/File:Barry_Moore_117th_U.S_Congress.jpg",
          "credit": "House Creative Committee · Public domain"
        }
      },
      {
        "name": "Everett Wess",
        "party": "Democratic",
        "className": "dem",
        "writeIn": false,
        "source": "https://ballotpedia.org/United_States_Senate_election_in_Alabama,_2026",
        "photo": null
      }
    ]
  },
  "AK": {
    "state": "Alaska",
    "seat": "REG",
    "source": "https://ballotpedia.org/United_States_Senate_election_in_Alaska,_2026",
    "checkedOn": "2026-11-03",
    "candidates": [
      {
        "name": "Dan S. Sullivan",
        "party": "Republican",
        "className": "rep",
        "writeIn": false,
        "source": "https://ballotpedia.org/United_States_Senate_election_in_Alaska,_2026",
        "photo": {
          "url": "https://commons.wikimedia.org/wiki/Special:FilePath/Senator%20Dan%20Sullivan%20official.jpg?width=240",
          "source": "https://commons.wikimedia.org/wiki/File:Senator_Dan_Sullivan_official.jpg",
          "credit": "United States Senate · Public domain"
        }
      },
      {
        "name": "Mary Peltola",
        "party": "Democratic",
        "className": "dem",
        "writeIn": false,
        "source": "https://ballotpedia.org/United_States_Senate_election_in_Alaska,_2026",
        "photo": {
          "url": "https://commons.wikimedia.org/wiki/Special:FilePath/Mary%20Peltola%20Congressional%20Member%20Portrait%20%282%29.jpeg?width=240",
          "source": "https://commons.wikimedia.org/wiki/File:Mary_Peltola_Congressional_Member_Portrait_%282%29.jpeg",
          "credit": "Leah Herman, House Creative Services · Public domain"
        }
      },
      {
        "name": "Gerald Heikes",
        "party": "Republican",
        "className": "rep",
        "writeIn": false,
        "source": "https://ballotpedia.org/United_States_Senate_election_in_Alaska,_2026",
        "photo": null
      },
      {
        "name": "Daniel J. Sullivan Jr.",
        "party": "No Party Affiliation",
        "className": "other",
        "writeIn": false,
        "source": "https://ballotpedia.org/United_States_Senate_election_in_Alaska,_2026",
        "photo": null
      },
      {
        "name": "Heather McElwain",
        "party": "Libertarian",
        "className": "other",
        "writeIn": true,
        "source": "https://ballotpedia.org/United_States_Senate_election_in_Alaska,_2026",
        "photo": null
      },
      {
        "name": "Sid Hill",
        "party": "Undeclared",
        "className": "other",
        "writeIn": true,
        "source": "https://ballotpedia.org/United_States_Senate_election_in_Alaska,_2026",
        "photo": null
      }
    ]
  },
  "AR": {
    "state": "Arkansas",
    "seat": "REG",
    "source": "https://ballotpedia.org/United_States_Senate_election_in_Arkansas,_2026",
    "checkedOn": "2026-11-03",
    "candidates": [
      {
        "name": "Tom Cotton",
        "party": "Republican",
        "className": "rep",
        "writeIn": false,
        "source": "https://ballotpedia.org/United_States_Senate_election_in_Arkansas,_2026",
        "photo": {
          "url": "https://commons.wikimedia.org/wiki/Special:FilePath/Tom%20Cotton%20official%20Senate%20photo.jpg?width=240",
          "source": "https://commons.wikimedia.org/wiki/File:Tom_Cotton_official_Senate_photo.jpg",
          "credit": "U.S. Senate Photo Office · Public domain"
        }
      },
      {
        "name": "Hallie Shoffner",
        "party": "Democratic",
        "className": "dem",
        "writeIn": false,
        "source": "https://ballotpedia.org/United_States_Senate_election_in_Arkansas,_2026",
        "photo": null
      },
      {
        "name": "Jeff Wadlin",
        "party": "Libertarian",
        "className": "other",
        "writeIn": false,
        "source": "https://ballotpedia.org/United_States_Senate_election_in_Arkansas,_2026",
        "photo": null
      }
    ]
  },
  "CO": {
    "state": "Colorado",
    "seat": "REG",
    "source": "https://ballotpedia.org/United_States_Senate_election_in_Colorado,_2026",
    "checkedOn": "2026-11-03",
    "candidates": [
      {
        "name": "John Hickenlooper",
        "party": "Democratic",
        "className": "dem",
        "writeIn": false,
        "source": "https://ballotpedia.org/United_States_Senate_election_in_Colorado,_2026",
        "photo": {
          "url": "https://commons.wikimedia.org/wiki/Special:FilePath/John%20Hickenlooper%2C%20official%20portrait%2C%20117th%20Congress.jpeg?width=240",
          "source": "https://commons.wikimedia.org/wiki/File:John_Hickenlooper%2C_official_portrait%2C_117th_Congress.jpeg",
          "credit": "Renee Bouchard, U.S. Senate Photographic Studio · Public domain"
        }
      },
      {
        "name": "Mark Baisley",
        "party": "Republican",
        "className": "rep",
        "writeIn": false,
        "source": "https://ballotpedia.org/United_States_Senate_election_in_Colorado,_2026",
        "photo": null
      },
      {
        "name": "Chris Baum",
        "party": "Approval Voting Party",
        "className": "other",
        "writeIn": false,
        "source": "https://ballotpedia.org/United_States_Senate_election_in_Colorado,_2026",
        "photo": null
      },
      {
        "name": "Bob Chew",
        "party": "Colorado Forward Party",
        "className": "other",
        "writeIn": false,
        "source": "https://ballotpedia.org/United_States_Senate_election_in_Colorado,_2026",
        "photo": null
      },
      {
        "name": "Blake Huber",
        "party": "Libertarian",
        "className": "other",
        "writeIn": false,
        "source": "https://ballotpedia.org/United_States_Senate_election_in_Colorado,_2026",
        "photo": null
      },
      {
        "name": "Adam Withrow",
        "party": "Unity Party",
        "className": "other",
        "writeIn": false,
        "source": "https://ballotpedia.org/United_States_Senate_election_in_Colorado,_2026",
        "photo": null
      },
      {
        "name": "Ryan Apelbaum",
        "party": "Republican",
        "className": "rep",
        "writeIn": true,
        "source": "https://ballotpedia.org/United_States_Senate_election_in_Colorado,_2026",
        "photo": null
      },
      {
        "name": "Will Powers",
        "party": "Republican",
        "className": "rep",
        "writeIn": true,
        "source": "https://ballotpedia.org/United_States_Senate_election_in_Colorado,_2026",
        "photo": null
      },
      {
        "name": "Don Willoughby",
        "party": "Unaffiliated",
        "className": "other",
        "writeIn": true,
        "source": "https://ballotpedia.org/United_States_Senate_election_in_Colorado,_2026",
        "photo": null
      }
    ]
  },
  "DE": {
    "state": "Delaware",
    "seat": "REG",
    "source": "https://ballotpedia.org/United_States_Senate_election_in_Delaware,_2026",
    "checkedOn": "2026-11-03",
    "candidates": [
      {
        "name": "Chris Coons",
        "party": "Democratic",
        "className": "dem",
        "writeIn": false,
        "source": "https://ballotpedia.org/United_States_Senate_election_in_Delaware,_2026",
        "photo": {
          "url": "https://commons.wikimedia.org/wiki/Special:FilePath/Chris%20Coons%2C%20official%20portrait%2C%20112th%20Congress.jpg?width=240",
          "source": "https://commons.wikimedia.org/wiki/File:Chris_Coons%2C_official_portrait%2C_112th_Congress.jpg",
          "credit": "United States Senate · Public domain"
        }
      },
      {
        "name": "Michael Katz",
        "party": "Republican",
        "className": "rep",
        "writeIn": false,
        "source": "https://ballotpedia.org/United_States_Senate_election_in_Delaware,_2026",
        "photo": null
      },
      {
        "name": "William McVay",
        "party": "Unaffiliated",
        "className": "other",
        "writeIn": true,
        "source": "https://ballotpedia.org/United_States_Senate_election_in_Delaware,_2026",
        "photo": null
      },
      {
        "name": "John Shulli",
        "party": "Unaffiliated",
        "className": "other",
        "writeIn": true,
        "source": "https://ballotpedia.org/United_States_Senate_election_in_Delaware,_2026",
        "photo": null
      },
      {
        "name": "Travis Jack Stevens",
        "party": "Unaffiliated",
        "className": "other",
        "writeIn": true,
        "source": "https://ballotpedia.org/United_States_Senate_election_in_Delaware,_2026",
        "photo": null
      }
    ]
  },
  "FL": {
    "state": "Florida",
    "seat": "SP",
    "source": "https://ballotpedia.org/United_States_Senate_special_election_in_Florida,_2026",
    "checkedOn": "2026-11-03",
    "candidates": [
      {
        "name": "Ashley B. Moody",
        "party": "Republican",
        "className": "rep",
        "writeIn": false,
        "source": "https://ballotpedia.org/United_States_Senate_special_election_in_Florida,_2026",
        "photo": null
      },
      {
        "name": "Angie Nixon",
        "party": "Democratic",
        "className": "dem",
        "writeIn": false,
        "source": "https://ballotpedia.org/United_States_Senate_special_election_in_Florida,_2026",
        "photo": null
      },
      {
        "name": "Neil Gillespie",
        "party": "No Party Affiliation",
        "className": "other",
        "writeIn": false,
        "source": "https://ballotpedia.org/United_States_Senate_special_election_in_Florida,_2026",
        "photo": null
      }
    ]
  },
  "GA": {
    "state": "Georgia",
    "seat": "REG",
    "source": "https://ballotpedia.org/United_States_Senate_election_in_Georgia,_2026",
    "checkedOn": "2026-11-03",
    "candidates": [
      {
        "name": "Jon Ossoff",
        "party": "Democratic",
        "className": "dem",
        "writeIn": false,
        "source": "https://ballotpedia.org/United_States_Senate_election_in_Georgia,_2026",
        "photo": {
          "url": "https://commons.wikimedia.org/wiki/Special:FilePath/Jon%20Ossoff%20Senate%20Portrait%202021.jpg?width=240",
          "source": "https://commons.wikimedia.org/wiki/File:Jon_Ossoff_Senate_Portrait_2021.jpg",
          "credit": "U.S. Senate Photographic Studio · Public domain"
        }
      },
      {
        "name": "Mike Collins",
        "party": "Republican",
        "className": "rep",
        "writeIn": false,
        "source": "https://ballotpedia.org/United_States_Senate_election_in_Georgia,_2026",
        "photo": null
      },
      {
        "name": "Christina Loren Clement",
        "party": "Republican",
        "className": "rep",
        "writeIn": true,
        "source": "https://ballotpedia.org/United_States_Senate_election_in_Georgia,_2026",
        "photo": null
      },
      {
        "name": "Elbert Bartell",
        "party": "Independent",
        "className": "other",
        "writeIn": true,
        "source": "https://ballotpedia.org/United_States_Senate_election_in_Georgia,_2026",
        "photo": null
      },
      {
        "name": "Cassandra Easton",
        "party": "Independent",
        "className": "other",
        "writeIn": true,
        "source": "https://ballotpedia.org/United_States_Senate_election_in_Georgia,_2026",
        "photo": null
      }
    ]
  },
  "ID": {
    "state": "Idaho",
    "seat": "REG",
    "source": "https://ballotpedia.org/United_States_Senate_election_in_Idaho,_2026",
    "checkedOn": "2026-11-03",
    "candidates": [
      {
        "name": "Jim Risch",
        "party": "Republican",
        "className": "rep",
        "writeIn": false,
        "source": "https://ballotpedia.org/United_States_Senate_election_in_Idaho,_2026",
        "photo": {
          "url": "https://commons.wikimedia.org/wiki/Special:FilePath/Jim%20Risch%20official%20portrait.jpg?width=240",
          "source": "https://commons.wikimedia.org/wiki/File:Jim_Risch_official_portrait.jpg",
          "credit": "US Senate · Public domain"
        }
      },
      {
        "name": "Matt Loesby",
        "party": "Libertarian",
        "className": "other",
        "writeIn": false,
        "source": "https://ballotpedia.org/United_States_Senate_election_in_Idaho,_2026",
        "photo": null
      },
      {
        "name": "Todd Achilles",
        "party": "Independent",
        "className": "other",
        "writeIn": false,
        "source": "https://ballotpedia.org/United_States_Senate_election_in_Idaho,_2026",
        "photo": null
      },
      {
        "name": "Natalie Fleming",
        "party": "Independent",
        "className": "other",
        "writeIn": false,
        "source": "https://ballotpedia.org/United_States_Senate_election_in_Idaho,_2026",
        "photo": null
      }
    ]
  },
  "IL": {
    "state": "Illinois",
    "seat": "REG",
    "source": "https://ballotpedia.org/United_States_Senate_election_in_Illinois,_2026",
    "checkedOn": "2026-11-03",
    "candidates": [
      {
        "name": "Juliana Stratton",
        "party": "Democratic",
        "className": "dem",
        "writeIn": false,
        "source": "https://ballotpedia.org/United_States_Senate_election_in_Illinois,_2026",
        "photo": null
      },
      {
        "name": "Don Tracy",
        "party": "Republican",
        "className": "rep",
        "writeIn": false,
        "source": "https://ballotpedia.org/United_States_Senate_election_in_Illinois,_2026",
        "photo": null
      },
      {
        "name": "Whitfield Harrington Jr.",
        "party": "American Center Party",
        "className": "other",
        "writeIn": false,
        "source": "https://ballotpedia.org/United_States_Senate_election_in_Illinois,_2026",
        "photo": null
      }
    ]
  },
  "IA": {
    "state": "Iowa",
    "seat": "REG",
    "source": "https://ballotpedia.org/United_States_Senate_election_in_Iowa,_2026",
    "checkedOn": "2026-11-03",
    "candidates": [
      {
        "name": "Josh Turek",
        "party": "Democratic",
        "className": "dem",
        "writeIn": false,
        "source": "https://ballotpedia.org/United_States_Senate_election_in_Iowa,_2026",
        "photo": null
      },
      {
        "name": "Ashley Hinson",
        "party": "Republican",
        "className": "rep",
        "writeIn": false,
        "source": "https://ballotpedia.org/United_States_Senate_election_in_Iowa,_2026",
        "photo": null
      },
      {
        "name": "Thomas Laehn",
        "party": "Libertarian",
        "className": "other",
        "writeIn": false,
        "source": "https://ballotpedia.org/United_States_Senate_election_in_Iowa,_2026",
        "photo": null
      }
    ]
  },
  "KS": {
    "state": "Kansas",
    "seat": "REG",
    "source": "https://ballotpedia.org/United_States_Senate_election_in_Kansas,_2026",
    "checkedOn": "2026-11-03",
    "candidates": [
      {
        "name": "Roger Marshall",
        "party": "Republican",
        "className": "rep",
        "writeIn": false,
        "source": "https://ballotpedia.org/United_States_Senate_election_in_Kansas,_2026",
        "photo": {
          "url": "https://commons.wikimedia.org/wiki/Special:FilePath/Roger%20Marshall%20official%20portrait.jpg?width=240",
          "source": "https://commons.wikimedia.org/wiki/File:Roger_Marshall_official_portrait.jpg",
          "credit": "Eric Connolly, U.S. House Office of Photography · Public domain"
        }
      },
      {
        "name": "Adam Hamilton",
        "party": "Democratic",
        "className": "dem",
        "writeIn": false,
        "source": "https://ballotpedia.org/United_States_Senate_election_in_Kansas,_2026",
        "photo": null
      },
      {
        "name": "David Graham",
        "party": "Libertarian",
        "className": "other",
        "writeIn": false,
        "source": "https://ballotpedia.org/United_States_Senate_election_in_Kansas,_2026",
        "photo": null
      },
      {
        "name": "Mark Baldwin",
        "party": "Independent",
        "className": "other",
        "writeIn": true,
        "source": "https://ballotpedia.org/United_States_Senate_election_in_Kansas,_2026",
        "photo": null
      }
    ]
  },
  "KY": {
    "state": "Kentucky",
    "seat": "REG",
    "source": "https://ballotpedia.org/United_States_Senate_election_in_Kentucky,_2026",
    "checkedOn": "2026-11-03",
    "candidates": [
      {
        "name": "Charles Booker",
        "party": "Democratic",
        "className": "dem",
        "writeIn": false,
        "source": "https://ballotpedia.org/United_States_Senate_election_in_Kentucky,_2026",
        "photo": null
      },
      {
        "name": "Andy Barr",
        "party": "Republican",
        "className": "rep",
        "writeIn": false,
        "source": "https://ballotpedia.org/United_States_Senate_election_in_Kentucky,_2026",
        "photo": null
      },
      {
        "name": "Christopher Campbell",
        "party": "Kentucky Party",
        "className": "other",
        "writeIn": false,
        "source": "https://ballotpedia.org/United_States_Senate_election_in_Kentucky,_2026",
        "photo": null
      },
      {
        "name": "Thomas Murphy",
        "party": "Independent",
        "className": "other",
        "writeIn": true,
        "source": "https://ballotpedia.org/United_States_Senate_election_in_Kentucky,_2026",
        "photo": null
      }
    ]
  },
  "LA": {
    "state": "Louisiana",
    "seat": "REG",
    "source": "https://ballotpedia.org/United_States_Senate_election_in_Louisiana,_2026",
    "checkedOn": "2026-11-03",
    "candidates": [
      {
        "name": "Jamie Davis",
        "party": "Democratic",
        "className": "dem",
        "writeIn": false,
        "source": "https://ballotpedia.org/United_States_Senate_election_in_Louisiana,_2026",
        "photo": null
      },
      {
        "name": "Julia Letlow",
        "party": "Republican",
        "className": "rep",
        "writeIn": false,
        "source": "https://ballotpedia.org/United_States_Senate_election_in_Louisiana,_2026",
        "photo": null
      }
    ]
  },
  "ME": {
    "state": "Maine",
    "seat": "REG",
    "source": "https://ballotpedia.org/United_States_Senate_election_in_Maine,_2026",
    "checkedOn": "2026-11-03",
    "candidates": [
      {
        "name": "Susan Collins",
        "party": "Republican",
        "className": "rep",
        "writeIn": false,
        "source": "https://ballotpedia.org/United_States_Senate_election_in_Maine,_2026",
        "photo": {
          "url": "https://commons.wikimedia.org/wiki/Special:FilePath/Senator%20Susan%20Collins%202014%20official%20portrait.jpg?width=240",
          "source": "https://commons.wikimedia.org/wiki/File:Senator_Susan_Collins_2014_official_portrait.jpg",
          "credit": "U.S. Congress · Public domain"
        }
      },
      {
        "name": "Troy Dale Jackson",
        "party": "Democratic",
        "className": "dem",
        "writeIn": false,
        "source": "https://ballotpedia.org/United_States_Senate_election_in_Maine,_2026",
        "photo": null
      },
      {
        "name": "Sigrid Ann Olson",
        "party": "Democratic",
        "className": "dem",
        "writeIn": true,
        "source": "https://ballotpedia.org/United_States_Senate_election_in_Maine,_2026",
        "photo": null
      },
      {
        "name": "Ashley Webb",
        "party": "Democratic",
        "className": "dem",
        "writeIn": true,
        "source": "https://ballotpedia.org/United_States_Senate_election_in_Maine,_2026",
        "photo": null
      },
      {
        "name": "Joseph Steinberger",
        "party": "Faith in Humanity Party",
        "className": "other",
        "writeIn": true,
        "source": "https://ballotpedia.org/United_States_Senate_election_in_Maine,_2026",
        "photo": null
      },
      {
        "name": "Brent Andrews",
        "party": "Unaffiliated",
        "className": "other",
        "writeIn": true,
        "source": "https://ballotpedia.org/United_States_Senate_election_in_Maine,_2026",
        "photo": null
      },
      {
        "name": "Michael Turcotte",
        "party": "Unenrolled",
        "className": "other",
        "writeIn": true,
        "source": "https://ballotpedia.org/United_States_Senate_election_in_Maine,_2026",
        "photo": null
      },
      {
        "name": "Gina Oswald",
        "party": "Independent",
        "className": "other",
        "writeIn": true,
        "source": "https://ballotpedia.org/United_States_Senate_election_in_Maine,_2026",
        "photo": null
      }
    ]
  },
  "MA": {
    "state": "Massachusetts",
    "seat": "REG",
    "source": "https://ballotpedia.org/United_States_Senate_election_in_Massachusetts,_2026",
    "checkedOn": "2026-11-03",
    "candidates": [
      {
        "name": "Edward J. Markey",
        "party": "Democratic",
        "className": "dem",
        "writeIn": false,
        "source": "https://ballotpedia.org/United_States_Senate_election_in_Massachusetts,_2026",
        "photo": null
      },
      {
        "name": "John Deaton",
        "party": "Republican",
        "className": "rep",
        "writeIn": false,
        "source": "https://ballotpedia.org/United_States_Senate_election_in_Massachusetts,_2026",
        "photo": null
      },
      {
        "name": "Joseph Tache",
        "party": "Party for Socialism and Liberation",
        "className": "other",
        "writeIn": false,
        "source": "https://ballotpedia.org/United_States_Senate_election_in_Massachusetts,_2026",
        "photo": null
      },
      {
        "name": "Shiva Ayyadurai",
        "party": "Unenrolled",
        "className": "other",
        "writeIn": false,
        "source": "https://ballotpedia.org/United_States_Senate_election_in_Massachusetts,_2026",
        "photo": null
      }
    ]
  },
  "MI": {
    "state": "Michigan",
    "seat": "REG",
    "source": "https://ballotpedia.org/United_States_Senate_election_in_Michigan,_2026",
    "checkedOn": "2026-11-03",
    "candidates": [
      {
        "name": "Abdul El-Sayed",
        "party": "Democratic",
        "className": "dem",
        "writeIn": false,
        "source": "https://ballotpedia.org/United_States_Senate_election_in_Michigan,_2026",
        "photo": null
      },
      {
        "name": "Mike Rogers",
        "party": "Republican",
        "className": "rep",
        "writeIn": false,
        "source": "https://ballotpedia.org/United_States_Senate_election_in_Michigan,_2026",
        "photo": null
      },
      {
        "name": "Douglas P. Marsh",
        "party": "Green",
        "className": "other",
        "writeIn": false,
        "source": "https://ballotpedia.org/United_States_Senate_election_in_Michigan,_2026",
        "photo": null
      },
      {
        "name": "Lydia Christensen",
        "party": "Libertarian",
        "className": "other",
        "writeIn": false,
        "source": "https://ballotpedia.org/United_States_Senate_election_in_Michigan,_2026",
        "photo": null
      },
      {
        "name": "Walter Kristy",
        "party": "Natural Law Party in Michigan",
        "className": "other",
        "writeIn": false,
        "source": "https://ballotpedia.org/United_States_Senate_election_in_Michigan,_2026",
        "photo": null
      },
      {
        "name": "Timothy Long",
        "party": "U.S. Taxpayers Party",
        "className": "other",
        "writeIn": false,
        "source": "https://ballotpedia.org/United_States_Senate_election_in_Michigan,_2026",
        "photo": null
      }
    ]
  },
  "MN": {
    "state": "Minnesota",
    "seat": "REG",
    "source": "https://ballotpedia.org/United_States_Senate_election_in_Minnesota,_2026",
    "checkedOn": "2026-11-03",
    "candidates": [
      {
        "name": "Peggy Flanagan",
        "party": "Democratic",
        "className": "dem",
        "writeIn": false,
        "source": "https://ballotpedia.org/United_States_Senate_election_in_Minnesota,_2026",
        "photo": null
      },
      {
        "name": "Michele Tafoya",
        "party": "Republican",
        "className": "rep",
        "writeIn": false,
        "source": "https://ballotpedia.org/United_States_Senate_election_in_Minnesota,_2026",
        "photo": null
      },
      {
        "name": "Rebecca Whiting",
        "party": "Libertarian",
        "className": "other",
        "writeIn": false,
        "source": "https://ballotpedia.org/United_States_Senate_election_in_Minnesota,_2026",
        "photo": null
      },
      {
        "name": "Marisa Simonetti",
        "party": "Unaffiliated",
        "className": "other",
        "writeIn": false,
        "source": "https://ballotpedia.org/United_States_Senate_election_in_Minnesota,_2026",
        "photo": null
      },
      {
        "name": "Alycia Gruenhagen",
        "party": "Republican",
        "className": "rep",
        "writeIn": true,
        "source": "https://ballotpedia.org/United_States_Senate_election_in_Minnesota,_2026",
        "photo": null
      }
    ]
  },
  "MS": {
    "state": "Mississippi",
    "seat": "REG",
    "source": "https://ballotpedia.org/United_States_Senate_election_in_Mississippi,_2026",
    "checkedOn": "2026-11-03",
    "candidates": [
      {
        "name": "Cindy Hyde-Smith",
        "party": "Republican",
        "className": "rep",
        "writeIn": false,
        "source": "https://ballotpedia.org/United_States_Senate_election_in_Mississippi,_2026",
        "photo": {
          "url": "https://commons.wikimedia.org/wiki/Special:FilePath/Cindy%20Hyde-Smith%20official%20photo.jpg?width=240",
          "source": "https://commons.wikimedia.org/wiki/File:Cindy_Hyde-Smith_official_photo.jpg",
          "credit": "U.S. Senate · Public domain"
        }
      },
      {
        "name": "Scott Colom",
        "party": "Democratic",
        "className": "dem",
        "writeIn": false,
        "source": "https://ballotpedia.org/United_States_Senate_election_in_Mississippi,_2026",
        "photo": null
      },
      {
        "name": "Ty Pinkins",
        "party": "Independent",
        "className": "other",
        "writeIn": false,
        "source": "https://ballotpedia.org/United_States_Senate_election_in_Mississippi,_2026",
        "photo": null
      }
    ]
  },
  "MT": {
    "state": "Montana",
    "seat": "REG",
    "source": "https://ballotpedia.org/United_States_Senate_election_in_Montana,_2026",
    "checkedOn": "2026-11-03",
    "candidates": [
      {
        "name": "Alani Bankhead",
        "party": "Democratic",
        "className": "dem",
        "writeIn": false,
        "source": "https://ballotpedia.org/United_States_Senate_election_in_Montana,_2026",
        "photo": null
      },
      {
        "name": "Kurt Alme",
        "party": "Republican",
        "className": "rep",
        "writeIn": false,
        "source": "https://ballotpedia.org/United_States_Senate_election_in_Montana,_2026",
        "photo": null
      },
      {
        "name": "Kyle Austin",
        "party": "Libertarian",
        "className": "other",
        "writeIn": false,
        "source": "https://ballotpedia.org/United_States_Senate_election_in_Montana,_2026",
        "photo": null
      },
      {
        "name": "Seth Bodnar",
        "party": "Independent",
        "className": "other",
        "writeIn": false,
        "source": "https://ballotpedia.org/United_States_Senate_election_in_Montana,_2026",
        "photo": null
      },
      {
        "name": "Jami Woodman",
        "party": "Nonpartisan",
        "className": "other",
        "writeIn": true,
        "source": "https://ballotpedia.org/United_States_Senate_election_in_Montana,_2026",
        "photo": null
      }
    ]
  },
  "NE": {
    "state": "Nebraska",
    "seat": "REG",
    "source": "https://ballotpedia.org/United_States_Senate_election_in_Nebraska,_2026",
    "checkedOn": "2026-11-03",
    "candidates": [
      {
        "name": "Pete Ricketts",
        "party": "Republican",
        "className": "rep",
        "writeIn": false,
        "source": "https://ballotpedia.org/United_States_Senate_election_in_Nebraska,_2026",
        "photo": null
      },
      {
        "name": "Chuck Conboy",
        "party": "America First Party Nebraska",
        "className": "other",
        "writeIn": false,
        "source": "https://ballotpedia.org/United_States_Senate_election_in_Nebraska,_2026",
        "photo": null
      },
      {
        "name": "Mike Marvin",
        "party": "Legal Marijuana Now Party",
        "className": "other",
        "writeIn": false,
        "source": "https://ballotpedia.org/United_States_Senate_election_in_Nebraska,_2026",
        "photo": null
      },
      {
        "name": "Robin Richards",
        "party": "Nebraska Working People Party",
        "className": "other",
        "writeIn": false,
        "source": "https://ballotpedia.org/United_States_Senate_election_in_Nebraska,_2026",
        "photo": null
      },
      {
        "name": "Dan Osborn",
        "party": "Nonpartisan",
        "className": "other",
        "writeIn": false,
        "source": "https://ballotpedia.org/United_States_Senate_election_in_Nebraska,_2026",
        "photo": null
      }
    ]
  },
  "NH": {
    "state": "New Hampshire",
    "seat": "REG",
    "source": "https://ballotpedia.org/United_States_Senate_election_in_New_Hampshire,_2026",
    "checkedOn": "2026-11-03",
    "candidates": [
      {
        "name": "Chris Pappas",
        "party": "Democratic",
        "className": "dem",
        "writeIn": false,
        "source": "https://ballotpedia.org/United_States_Senate_election_in_New_Hampshire,_2026",
        "photo": null
      },
      {
        "name": "John Sununu",
        "party": "Republican",
        "className": "rep",
        "writeIn": false,
        "source": "https://ballotpedia.org/United_States_Senate_election_in_New_Hampshire,_2026",
        "photo": null
      },
      {
        "name": "Edmond Laplante",
        "party": "Constitution Party",
        "className": "other",
        "writeIn": false,
        "source": "https://ballotpedia.org/United_States_Senate_election_in_New_Hampshire,_2026",
        "photo": null
      }
    ]
  },
  "NJ": {
    "state": "New Jersey",
    "seat": "REG",
    "source": "https://ballotpedia.org/United_States_Senate_election_in_New_Jersey,_2026",
    "checkedOn": "2026-11-03",
    "candidates": [
      {
        "name": "Cory Booker",
        "party": "Democratic",
        "className": "dem",
        "writeIn": false,
        "source": "https://ballotpedia.org/United_States_Senate_election_in_New_Jersey,_2026",
        "photo": {
          "url": "https://commons.wikimedia.org/wiki/Special:FilePath/Cory%20Booker%2C%20official%20portrait%20%28119th%20Congress%29.jpg?width=240",
          "source": "https://commons.wikimedia.org/wiki/File:Cory_Booker%2C_official_portrait_%28119th_Congress%29.jpg",
          "credit": "U.S. Senate · Public domain"
        }
      },
      {
        "name": "Justin Murphy",
        "party": "Republican",
        "className": "rep",
        "writeIn": false,
        "source": "https://ballotpedia.org/United_States_Senate_election_in_New_Jersey,_2026",
        "photo": null
      },
      {
        "name": "Veronica Fernandez",
        "party": "End the Corruption! Party",
        "className": "other",
        "writeIn": false,
        "source": "https://ballotpedia.org/United_States_Senate_election_in_New_Jersey,_2026",
        "photo": null
      },
      {
        "name": "Joanne Kuniansky",
        "party": "Socialist Workers Party",
        "className": "other",
        "writeIn": false,
        "source": "https://ballotpedia.org/United_States_Senate_election_in_New_Jersey,_2026",
        "photo": null
      },
      {
        "name": "Eduardo Castillo",
        "party": "Democratic",
        "className": "dem",
        "writeIn": true,
        "source": "https://ballotpedia.org/United_States_Senate_election_in_New_Jersey,_2026",
        "photo": null
      }
    ]
  },
  "NM": {
    "state": "New Mexico",
    "seat": "REG",
    "source": "https://ballotpedia.org/United_States_Senate_election_in_New_Mexico,_2026",
    "checkedOn": "2026-11-03",
    "candidates": [
      {
        "name": "Ben Ray Luján",
        "party": "Democratic",
        "className": "dem",
        "writeIn": false,
        "source": "https://ballotpedia.org/United_States_Senate_election_in_New_Mexico,_2026",
        "photo": null
      },
      {
        "name": "Larry E. Marker",
        "party": "Republican",
        "className": "rep",
        "writeIn": false,
        "source": "https://ballotpedia.org/United_States_Senate_election_in_New_Mexico,_2026",
        "photo": null
      }
    ]
  },
  "NC": {
    "state": "North Carolina",
    "seat": "REG",
    "source": "https://ballotpedia.org/United_States_Senate_election_in_North_Carolina,_2026",
    "checkedOn": "2026-11-03",
    "candidates": [
      {
        "name": "Roy Cooper",
        "party": "Democratic",
        "className": "dem",
        "writeIn": false,
        "source": "https://ballotpedia.org/United_States_Senate_election_in_North_Carolina,_2026",
        "photo": null
      },
      {
        "name": "Michael Whatley",
        "party": "Republican",
        "className": "rep",
        "writeIn": false,
        "source": "https://ballotpedia.org/United_States_Senate_election_in_North_Carolina,_2026",
        "photo": null
      },
      {
        "name": "Michael Dublin",
        "party": "Green",
        "className": "other",
        "writeIn": false,
        "source": "https://ballotpedia.org/United_States_Senate_election_in_North_Carolina,_2026",
        "photo": null
      },
      {
        "name": "Shannon Bray",
        "party": "Libertarian",
        "className": "other",
        "writeIn": false,
        "source": "https://ballotpedia.org/United_States_Senate_election_in_North_Carolina,_2026",
        "photo": null
      }
    ]
  },
  "OH": {
    "state": "Ohio",
    "seat": "SP",
    "source": "https://ballotpedia.org/United_States_Senate_special_election_in_Ohio,_2026",
    "checkedOn": "2026-11-03",
    "candidates": [
      {
        "name": "Jon Husted",
        "party": "Republican",
        "className": "rep",
        "writeIn": false,
        "source": "https://ballotpedia.org/United_States_Senate_special_election_in_Ohio,_2026",
        "photo": null
      },
      {
        "name": "Sherrod Brown",
        "party": "Democratic",
        "className": "dem",
        "writeIn": false,
        "source": "https://ballotpedia.org/United_States_Senate_special_election_in_Ohio,_2026",
        "photo": {
          "url": "https://commons.wikimedia.org/wiki/Special:FilePath/Sherrod%20Brown%20official%20photo%202009.jpg?width=240",
          "source": "https://commons.wikimedia.org/wiki/File:Sherrod_Brown_official_photo_2009.jpg",
          "credit": "Office of Senator Sherrod Brown · Public domain"
        }
      },
      {
        "name": "Bill Redpath",
        "party": "Libertarian",
        "className": "other",
        "writeIn": false,
        "source": "https://ballotpedia.org/United_States_Senate_special_election_in_Ohio,_2026",
        "photo": null
      },
      {
        "name": "Gregory Levy",
        "party": "Independent",
        "className": "other",
        "writeIn": false,
        "source": "https://ballotpedia.org/United_States_Senate_special_election_in_Ohio,_2026",
        "photo": null
      },
      {
        "name": "Stephen Faris",
        "party": "Independent",
        "className": "other",
        "writeIn": true,
        "source": "https://ballotpedia.org/United_States_Senate_special_election_in_Ohio,_2026",
        "photo": null
      },
      {
        "name": "Anthony Holliman",
        "party": "Independent",
        "className": "other",
        "writeIn": true,
        "source": "https://ballotpedia.org/United_States_Senate_special_election_in_Ohio,_2026",
        "photo": null
      }
    ]
  },
  "OK": {
    "state": "Oklahoma",
    "seat": "REG",
    "source": "https://ballotpedia.org/United_States_Senate_election_in_Oklahoma,_2026",
    "checkedOn": "2026-11-03",
    "candidates": [
      {
        "name": "N'Kiyla Thomas",
        "party": "Democratic",
        "className": "dem",
        "writeIn": false,
        "source": "https://ballotpedia.org/United_States_Senate_election_in_Oklahoma,_2026",
        "photo": null
      },
      {
        "name": "Kevin Hern",
        "party": "Republican",
        "className": "rep",
        "writeIn": false,
        "source": "https://ballotpedia.org/United_States_Senate_election_in_Oklahoma,_2026",
        "photo": null
      },
      {
        "name": "Sevier White",
        "party": "Libertarian",
        "className": "other",
        "writeIn": false,
        "source": "https://ballotpedia.org/United_States_Senate_election_in_Oklahoma,_2026",
        "photo": null
      },
      {
        "name": "Ron Meinhardt",
        "party": "Independent",
        "className": "other",
        "writeIn": false,
        "source": "https://ballotpedia.org/United_States_Senate_election_in_Oklahoma,_2026",
        "photo": null
      },
      {
        "name": "Curtis Stinnett",
        "party": "Independent",
        "className": "other",
        "writeIn": false,
        "source": "https://ballotpedia.org/United_States_Senate_election_in_Oklahoma,_2026",
        "photo": null
      }
    ]
  },
  "OR": {
    "state": "Oregon",
    "seat": "REG",
    "source": "https://ballotpedia.org/United_States_Senate_election_in_Oregon,_2026",
    "checkedOn": "2026-11-03",
    "candidates": [
      {
        "name": "Jeff Merkley",
        "party": "Democratic / Working Families Party",
        "className": "dem",
        "writeIn": false,
        "source": "https://ballotpedia.org/United_States_Senate_election_in_Oregon,_2026",
        "photo": {
          "url": "https://commons.wikimedia.org/wiki/Special:FilePath/Jeff%20Merkley.jpg?width=240",
          "source": "https://commons.wikimedia.org/wiki/File:Jeff_Merkley.jpg",
          "credit": "United States Senate / Frank A. Fey · Public domain"
        }
      },
      {
        "name": "David Brock Smith",
        "party": "Republican",
        "className": "rep",
        "writeIn": false,
        "source": "https://ballotpedia.org/United_States_Senate_election_in_Oregon,_2026",
        "photo": null
      },
      {
        "name": "Gary Dye",
        "party": "Libertarian",
        "className": "other",
        "writeIn": false,
        "source": "https://ballotpedia.org/United_States_Senate_election_in_Oregon,_2026",
        "photo": null
      },
      {
        "name": "Chris Henry",
        "party": "Pacific Green Party of Oregon / Progressive Party",
        "className": "other",
        "writeIn": false,
        "source": "https://ballotpedia.org/United_States_Senate_election_in_Oregon,_2026",
        "photo": null
      }
    ]
  },
  "RI": {
    "state": "Rhode Island",
    "seat": "REG",
    "source": "https://ballotpedia.org/United_States_Senate_election_in_Rhode_Island,_2026",
    "checkedOn": "2026-11-03",
    "candidates": [
      {
        "name": "Jack Reed",
        "party": "Democratic",
        "className": "dem",
        "writeIn": false,
        "source": "https://ballotpedia.org/United_States_Senate_election_in_Rhode_Island,_2026",
        "photo": null
      },
      {
        "name": "Raymond McKay",
        "party": "Republican",
        "className": "rep",
        "writeIn": false,
        "source": "https://ballotpedia.org/United_States_Senate_election_in_Rhode_Island,_2026",
        "photo": null
      },
      {
        "name": "Michael Bahry",
        "party": "Independent",
        "className": "other",
        "writeIn": false,
        "source": "https://ballotpedia.org/United_States_Senate_election_in_Rhode_Island,_2026",
        "photo": null
      }
    ]
  },
  "SC": {
    "state": "South Carolina",
    "seat": "REG",
    "source": "https://ballotpedia.org/United_States_Senate_election_in_South_Carolina,_2026",
    "checkedOn": "2026-11-03",
    "candidates": [
      {
        "name": "Darline Graham",
        "party": "Republican",
        "className": "rep",
        "writeIn": false,
        "source": "https://ballotpedia.org/United_States_Senate_election_in_South_Carolina,_2026",
        "photo": null
      },
      {
        "name": "Annie Andrews",
        "party": "Democratic",
        "className": "dem",
        "writeIn": false,
        "source": "https://ballotpedia.org/United_States_Senate_election_in_South_Carolina,_2026",
        "photo": null
      },
      {
        "name": "Mark Hackett",
        "party": "Constitution Party",
        "className": "other",
        "writeIn": false,
        "source": "https://ballotpedia.org/United_States_Senate_election_in_South_Carolina,_2026",
        "photo": null
      },
      {
        "name": "Kasie Whitener",
        "party": "Libertarian",
        "className": "other",
        "writeIn": false,
        "source": "https://ballotpedia.org/United_States_Senate_election_in_South_Carolina,_2026",
        "photo": null
      },
      {
        "name": "Catherine Fleming Bruce",
        "party": "Democratic",
        "className": "dem",
        "writeIn": true,
        "source": "https://ballotpedia.org/United_States_Senate_election_in_South_Carolina,_2026",
        "photo": null
      }
    ]
  },
  "SD": {
    "state": "South Dakota",
    "seat": "REG",
    "source": "https://ballotpedia.org/United_States_Senate_election_in_South_Dakota,_2026",
    "checkedOn": "2026-11-03",
    "candidates": [
      {
        "name": "Mike Rounds",
        "party": "Republican",
        "className": "rep",
        "writeIn": false,
        "source": "https://ballotpedia.org/United_States_Senate_election_in_South_Dakota,_2026",
        "photo": {
          "url": "https://commons.wikimedia.org/wiki/Special:FilePath/Mike%20Rounds%20official%20Senate%20portrait.jpg?width=240",
          "source": "https://commons.wikimedia.org/wiki/File:Mike_Rounds_official_Senate_portrait.jpg",
          "credit": "United States Congress · Public domain"
        }
      },
      {
        "name": "Brian Bengs",
        "party": "Independent",
        "className": "other",
        "writeIn": false,
        "source": "https://ballotpedia.org/United_States_Senate_election_in_South_Dakota,_2026",
        "photo": null
      }
    ]
  },
  "TN": {
    "state": "Tennessee",
    "seat": "REG",
    "source": "https://ballotpedia.org/United_States_Senate_election_in_Tennessee,_2026",
    "checkedOn": "2026-11-03",
    "candidates": [
      {
        "name": "Bill Hagerty",
        "party": "Republican",
        "className": "rep",
        "writeIn": false,
        "source": "https://ballotpedia.org/United_States_Senate_election_in_Tennessee,_2026",
        "photo": null
      },
      {
        "name": "Marquita Bradshaw",
        "party": "Democratic",
        "className": "dem",
        "writeIn": false,
        "source": "https://ballotpedia.org/United_States_Senate_election_in_Tennessee,_2026",
        "photo": null
      },
      {
        "name": "Tharon Chandler",
        "party": "Independent",
        "className": "other",
        "writeIn": false,
        "source": "https://ballotpedia.org/United_States_Senate_election_in_Tennessee,_2026",
        "photo": null
      },
      {
        "name": "Andrew Gerena",
        "party": "Independent",
        "className": "other",
        "writeIn": false,
        "source": "https://ballotpedia.org/United_States_Senate_election_in_Tennessee,_2026",
        "photo": null
      },
      {
        "name": "Jeremy Hearn",
        "party": "Independent",
        "className": "other",
        "writeIn": false,
        "source": "https://ballotpedia.org/United_States_Senate_election_in_Tennessee,_2026",
        "photo": null
      },
      {
        "name": "Robert Jones",
        "party": "Independent",
        "className": "other",
        "writeIn": false,
        "source": "https://ballotpedia.org/United_States_Senate_election_in_Tennessee,_2026",
        "photo": null
      },
      {
        "name": "James Macon III",
        "party": "Independent",
        "className": "other",
        "writeIn": false,
        "source": "https://ballotpedia.org/United_States_Senate_election_in_Tennessee,_2026",
        "photo": null
      },
      {
        "name": "Yoshi Matthews",
        "party": "Independent",
        "className": "other",
        "writeIn": false,
        "source": "https://ballotpedia.org/United_States_Senate_election_in_Tennessee,_2026",
        "photo": null
      },
      {
        "name": "David Sutman Jr.",
        "party": "Independent",
        "className": "other",
        "writeIn": false,
        "source": "https://ballotpedia.org/United_States_Senate_election_in_Tennessee,_2026",
        "photo": null
      },
      {
        "name": "Catherine Whitson",
        "party": "Independent",
        "className": "other",
        "writeIn": false,
        "source": "https://ballotpedia.org/United_States_Senate_election_in_Tennessee,_2026",
        "photo": null
      }
    ]
  },
  "TX": {
  "state": "Texas",
  "seat": "REG",
  "source": "https://www.sos.state.tx.us/elections/forms/2026-ballot-cert.pdf",
  "checkedOn": "2026-11-03",
  "candidates": [
    {
      "name": "James Talarico",
      "party": "Democratic",
      "className": "dem",
      "writeIn": false,
      "source": "https://www.sos.state.tx.us/elections/forms/2026-ballot-cert.pdf",
      "photo": null
    },
    {
      "name": "Ken Paxton",
      "party": "Republican",
      "className": "rep",
      "writeIn": false,
      "source": "https://www.sos.state.tx.us/elections/forms/2026-ballot-cert.pdf",
      "photo": null
    },
    {
      "name": "Ted Brown",
      "party": "Libertarian",
      "className": "other",
      "writeIn": false,
      "source": "https://www.sos.state.tx.us/elections/forms/2026-ballot-cert.pdf",
      "photo": null
    },
    {
      "name": "Avery Ayers",
      "party": "Independent",
      "className": "other",
      "writeIn": true,
      "source": "https://ballotpedia.org/United_States_Senate_election_in_Texas,_2026",
      "photo": null
    },
    {
      "name": "Bradford Hall",
      "party": "Independent",
      "className": "other",
      "writeIn": true,
      "source": "https://ballotpedia.org/United_States_Senate_election_in_Texas,_2026",
      "photo": null
    },
    {
      "name": "Zul Mohamed",
      "party": "Independent",
      "className": "other",
      "writeIn": true,
      "source": "https://ballotpedia.org/United_States_Senate_election_in_Texas,_2026",
      "photo": null
    },
    {
      "name": "Jade Simmons",
      "party": "Independent",
      "className": "other",
      "writeIn": true,
      "source": "https://ballotpedia.org/United_States_Senate_election_in_Texas,_2026",
      "photo": null
    }
  ]
},
  "VA": {
    "state": "Virginia",
    "seat": "REG",
    "source": "https://ballotpedia.org/United_States_Senate_election_in_Virginia,_2026",
    "checkedOn": "2026-11-03",
    "candidates": [
      {
        "name": "Mark Warner",
        "party": "Democratic",
        "className": "dem",
        "writeIn": false,
        "source": "https://ballotpedia.org/United_States_Senate_election_in_Virginia,_2026",
        "photo": {
          "url": "https://commons.wikimedia.org/wiki/Special:FilePath/Mark%20Warner%2C%20official%20112th%20Congress%20Senate%20portrait.jpg?width=240",
          "source": "https://commons.wikimedia.org/wiki/File:Mark_Warner%2C_official_112th_Congress_Senate_portrait.jpg",
          "credit": "Office of U.S. Senator Mark Warner · Public domain"
        }
      },
      {
        "name": "Bert Mizusawa",
        "party": "Republican",
        "className": "rep",
        "writeIn": false,
        "source": "https://ballotpedia.org/United_States_Senate_election_in_Virginia,_2026",
        "photo": null
      }
    ]
  },
  "WV": {
    "state": "West Virginia",
    "seat": "REG",
    "source": "https://ballotpedia.org/United_States_Senate_election_in_West_Virginia,_2026",
    "checkedOn": "2026-11-03",
    "candidates": [
      {
        "name": "Shelley Moore Capito",
        "party": "Republican",
        "className": "rep",
        "writeIn": false,
        "source": "https://ballotpedia.org/United_States_Senate_election_in_West_Virginia,_2026",
        "photo": null
      },
      {
        "name": "Rachel Fetty Anderson",
        "party": "Democratic",
        "className": "dem",
        "writeIn": false,
        "source": "https://ballotpedia.org/United_States_Senate_election_in_West_Virginia,_2026",
        "photo": null
      },
      {
        "name": "S. Marshall Wilson",
        "party": "Constitution Party",
        "className": "other",
        "writeIn": false,
        "source": "https://ballotpedia.org/United_States_Senate_election_in_West_Virginia,_2026",
        "photo": null
      },
      {
        "name": "Rio Phillips",
        "party": "Independent",
        "className": "other",
        "writeIn": true,
        "source": "https://ballotpedia.org/United_States_Senate_election_in_West_Virginia,_2026",
        "photo": null
      }
    ]
  },
  "WY": {
    "state": "Wyoming",
    "seat": "REG",
    "source": "https://ballotpedia.org/United_States_Senate_election_in_Wyoming,_2026",
    "checkedOn": "2026-11-03",
    "candidates": [
      {
        "name": "James Byrd",
        "party": "Democratic",
        "className": "dem",
        "writeIn": false,
        "source": "https://ballotpedia.org/United_States_Senate_election_in_Wyoming,_2026",
        "photo": null
      },
      {
        "name": "Harriet Hageman",
        "party": "Republican",
        "className": "rep",
        "writeIn": false,
        "source": "https://ballotpedia.org/United_States_Senate_election_in_Wyoming,_2026",
        "photo": null
      }
    ]
  }
}

export const SENATE_STATES = Object.keys(SENATE_DIRECTORY)
export function migrateRaceId(id: string) {
  return id.replace("-OH-REG", "-OH-SP").replace("-OK-SP", "-OK-REG")
}
export function getRaceCandidates(
  race: { code: string; seat: "REG" | "SP" },
  _polling?: PollingDetail,
  _forecast?: ForecastRace,
  _result?: SenateResultRace,
): SenateCandidate[] {
  const entry = SENATE_DIRECTORY[race.code]
  return entry?.seat === race.seat ? entry.candidates : []
}

// Deliberately exact, apart from case/spacing: do not assign another person's
// votes through surname/fuzzy matching. Additional explicit aliases need review.
export function candidateResult(candidate: SenateCandidate, result?: SenateResultRace) {
  const normalize = (name: string) => name.trim().replace(/\s+/g, " ").toLowerCase()
  return result?.cands.find((row) => normalize(row.n) === normalize(candidate.name))
}
