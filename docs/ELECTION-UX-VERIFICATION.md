# Election UX verification and portrait audit

Modified originals are preserved in `backups/election-ux/`.

## Sources and constraints

- Governor held-office baseline: 24 Democratic and 26 Republican; checked November 3, 2026 against https://www.multistate.us/resources/2026-governors and https://www.nga.org/governors/. Territories are excluded and accessed separately.
- Closing schedule checked against https://www.270towin.com/poll-closing-times/ on November 3, 2026. Times use EST converted to UTC; split-zone states retain regional waves. New Hampshire is a latest-closing bound; local polls can close earlier. Extensions are not available in the connected feed.
- There is no authoritative call provider. Held offices remain fixed; vote leads and complete counts do not change composition.
- No additional portraits were approved: licensing and candidate identity could not be established for missing images. Existing attributed Senate portraits remain; Governor name-only cross-office reuse was removed. Neutral initials remain visible.

## Portrait inventory

Senate: 153 records, 15 existing image references, 138 missing.

Missing Senate portraits:

- Barry Moore
- Everett Wess
- Gerald Heikes
- Daniel J. Sullivan Jr.
- Heather McElwain
- Sid Hill
- Hallie Shoffner
- Jeff Wadlin
- Mark Baisley
- Chris Baum
- Bob Chew
- Blake Huber
- Adam Withrow
- Ryan Apelbaum
- Will Powers
- Don Willoughby
- Michael Katz
- William McVay
- John Shulli
- Travis Jack Stevens
- Ashley B. Moody
- Angie Nixon
- Neil Gillespie
- Mike Collins
- Christina Loren Clement
- Elbert Bartell
- Cassandra Easton
- Matt Loesby
- Todd Achilles
- Natalie Fleming
- Juliana Stratton
- Don Tracy
- Whitfield Harrington Jr.
- Josh Turek
- Ashley Hinson
- Thomas Laehn
- Adam Hamilton
- David Graham
- Mark Baldwin
- Charles Booker
- Andy Barr
- Christopher Campbell
- Thomas Murphy
- Jamie Davis
- Julia Letlow
- Troy Dale Jackson
- Sigrid Ann Olson
- Ashley Webb
- Joseph Steinberger
- Brent Andrews
- Michael Turcotte
- Gina Oswald
- Edward J. Markey
- John Deaton
- Joseph Tache
- Shiva Ayyadurai
- Abdul El-Sayed
- Mike Rogers
- Douglas P. Marsh
- Lydia Christensen
- Walter Kristy
- Timothy Long
- Peggy Flanagan
- Michele Tafoya
- Rebecca Whiting
- Marisa Simonetti
- Alycia Gruenhagen
- Scott Colom
- Ty Pinkins
- Alani Bankhead
- Kurt Alme
- Kyle Austin
- Seth Bodnar
- Jami Woodman
- Pete Ricketts
- Chuck Conboy
- Mike Marvin
- Robin Richards
- Dan Osborn
- Chris Pappas
- John Sununu
- Edmond Laplante
- Justin Murphy
- Veronica Fernandez
- Joanne Kuniansky
- Eduardo Castillo
- Ben Ray Luján
- Larry E. Marker
- Roy Cooper
- Michael Whatley
- Michael Dublin
- Shannon Bray
- Jon Husted
- Bill Redpath
- Gregory Levy
- Stephen Faris
- Anthony Holliman
- N'Kiyla Thomas
- Kevin Hern
- Sevier White
- Ron Meinhardt
- Curtis Stinnett
- David Brock Smith
- Gary Dye
- Chris Henry
- Jack Reed
- Raymond McKay
- Michael Bahry
- Darline Graham
- Annie Andrews
- Mark Hackett
- Kasie Whitener
- Catherine Fleming Bruce
- Brian Bengs
- Bill Hagerty
- Marquita Bradshaw
- Tharon Chandler
- Andrew Gerena
- Jeremy Hearn
- Robert Jones
- James Macon III
- Yoshi Matthews
- David Sutman Jr.
- Catherine Whitson
- James Talarico
- Ken Paxton
- Ted Brown
- Avery Ayers
- Bradford Hall
- Zul Mohamed
- Jade Simmons
- Bert Mizusawa
- Shelley Moore Capito
- Rachel Fetty Anderson
- S. Marshall Wilson
- Rio Phillips
- James Byrd
- Harriet Hageman

Governor records without verified portraits:

- Alaska: David Bronson (R); Jonathan Kreiss-Tomkins (D); Treg Taylor (R); Bernadette Wilson (R)
- Alabama: Doug Jones (D); Tommy Tuberville (R)
- Arizona: Gov. Katie Hobbs (D); Andy Biggs (R)
- Arkansas: Gov. Sarah Huckabee Sanders (R); Fredrick Love (D)
- California: Xavier Becerra (D); Steve Hilton (R)
- Colorado: Victor Marx (R); Phil Weiser (D)
- Florida: Byron Donalds (R); David Jolly (D)
- Georgia: Keisha Lance Bottoms (D); Rick Jackson (R)
- Guam: Vicente Ada (R); Therese Terlaje (D)
- Hawaii: Gov. Josh Green (D); Gary Cordery (R)
- Idaho: Gov. Brad Little (R); Terri Pickens (D)
- Illinois: Gov. JB Pritzker (D); Darren Bailey (R)
- Iowa: Zach Lahn (R); Rob Sand (D)
- Kansas: Cindy Holscher (D); Ty Masterson (R)
- Maine: Hannah Pingree (D); Bobby Charles (R); Rick Bennett (I)
- Maryland: Gov. Wes Moore (D); Dan Cox (R)
- Massachusetts: Gov. Maura Healey (D); Michael Minogue (R)
- Michigan: Jocelyn Benson (D); John James (R)
- Minnesota: Lisa Demuth (R); Amy Klobuchar (D)
- Northern Mariana Islands: Ralph Torres (R); Blas T. Attao (Independent); Lawrence Camacho (Independent)
- Nebraska: Gov. Jim Pillen (R); Lynne Walz (D)
- Connecticut: Gov. Ned Lamont (D); Ryan Fazio (R)
- Nevada: Gov. Joe Lombardo (R); Aaron Ford (D)
- New Hampshire: Gov. Kelly Ayotte (R); Cinde Warmington (D)
- New Mexico: Deb Haaland (D); Greggory Hull (R)
- New York: Gov. Kathy Hochul (D); Bruce Blakeman (R)
- Ohio: Amy Acton (D); Vivek Ramaswamy (R)
- Oklahoma: Cydni Munson (D); August 25 Primary Runoff Winner (R)
- Oregon: Gov. Tina Kotek (D); Christine Drazan (R)
- Pennsylvania: Gov. Josh Shapiro (D); Stacy Garrity (R)
- Rhode Island: Helena Foulkes (D); Aaron Guckian (R)
- South Carolina: No verified candidate names
- South Dakota: Gov. Larry Rhoden (R); Dan Ahlers (D)
- Tennessee: Marsha Blackburn (R); Jerri Green (D)
- Texas: Gov. Greg Abbott (R); Gina Hinojosa (D)
- Vermont: Gov. Phil Scott (R); Amanda Janoo (D)
- Virgin Islands: Stacey Plaskett (D); Independents:

Oakland Benta; Adlah Donastorg Jr.; Gustav James; Warren Mosler
- Wisconsin: David Crowley (D); Tom Tiffany (R)
- Wyoming: Eric Barlow (R); Ken Casner (D)

## Verification

- `npx tsc --noEmit`: passed.
- `npm run build`: passed; Vite configuration compatibility and chunk-size warnings remain.
- `npm test --if-present`: 22 passed, 0 failed.
- Chrome: desktop and 390px mobile; Senate selection and four sort options; keyboard tooltip; office composition switching; Governor 50-state directory; all three tabs and outline counts; no uncaught errors after fresh navigation.
- Mobile document width equals viewport; navigation and comparison tables retain internal scrolling.
- Portrait completeness, licensing revalidation for existing references, all external image loads, future closure boundaries in browser, live provider outages and 15-minute elapsed refresh cycles were not fully verified.

## Readiness

Buildable and locally checked. Not ready to claim complete verified election-night coverage: missing portraits, authoritative call updates, live closure extensions, and incomplete provider coverage remain. Governor territorial party totals are not asserted.
