// Mock data for the prototype. Everything is relative to "today" so the demo always looks current.
window.DATA = (function () {
  var base = new Date();
  base.setHours(0, 0, 0, 0);

  function at(d, hm) {
    var p = hm.split(':');
    var x = new Date(base);
    x.setDate(x.getDate() + d);
    x.setHours(+p[0], +p[1], 0, 0);
    return x;
  }
  var n = 0;
  function ev(d, s, e, title, people, extra) {
    return Object.assign({ id: 'e' + (++n), start: at(d, s), end: at(d, e), title: title, people: people }, extra || {});
  }
  function allDay(d, days, title, people, extra) {
    return Object.assign({ id: 'e' + (++n), allDay: true, start: at(d, '00:00'), end: at(d + days, '00:00'), title: title, people: people }, extra || {});
  }

  var ALL = ['austin', 'jenna', 'amelia', 'eliza', 'junia'];

  var people = [
    { id: 'austin', name: 'Austin', color: '#2D5BFF', rgb: '45 91 255', ink: '#FFFFFF', home: true, status: 'Home' },
    { id: 'jenna', name: 'Jenna', color: '#0EA5E9', rgb: '14 165 233', ink: '#FFFFFF', home: true, status: 'Home' },
    { id: 'amelia', name: 'Amelia', color: '#7C3AED', rgb: '124 58 237', ink: '#FFFFFF', home: true, status: 'Home' },
    { id: 'eliza', name: 'Eliza', color: '#E4007C', rgb: '228 0 124', ink: '#FFFFFF', home: true, status: 'Home' },
    { id: 'junia', name: 'Junia', color: '#00A36C', rgb: '0 163 108', ink: '#FFFFFF', home: true, status: 'Home' }
  ];
  var family = { id: 'family', name: 'Family', color: '#111111', rgb: '17 17 17', ink: '#FFFFFF' };

  // ---------------------------------------------------------------- calendar
  var events = [
    // Today
    allDay(0, 1, 'Pajama Day at school', ['junia']),
    allDay(0, 1, 'Garbage + recycling night', ALL),
    ev(0, '07:00', '07:45', 'Gym', ['jenna'], { loc: 'Downtown Y' }),
    ev(0, '08:15', '08:40', 'School drop-off', ['austin'], { travel: 10, loc: 'Elementary' }),
    ev(0, '09:30', '10:30', 'Design review', ['jenna'], { loc: 'Office · Room 4B' }),
    ev(0, '12:00', '12:45', 'Dentist', ['amelia', 'jenna'], { travel: 15, loc: 'Bellingham Dental' }),
    ev(0, '13:00', '14:00', 'Lunch with Sam', ['austin'], { loc: 'Café Rumba' }),
    ev(0, '15:45', '16:30', 'Piano lesson', ['junia'], { travel: 12, loc: "Ms. Park's Studio", notes: 'Bring the blue theory book.' }),
    ev(0, '16:05', '16:30', 'Drive Amelia to soccer', ['jenna']),
    ev(0, '16:25', '16:50', 'Pick up Junia', ['jenna'], { loc: "Ms. Park's Studio" }),
    ev(0, '16:30', '18:00', 'Soccer practice', ['amelia'], { travel: 20, loc: 'Soccer fields', notes: 'Shin guards + water bottle. Rain likely — pack a jacket.' }),
    ev(0, '17:00', '17:30', 'Parent–teacher call', ['austin', 'jenna'], { loc: 'Zoom' }),
    ev(0, '18:30', '19:30', 'Sunday dinner', ALL, { travel: 20, notes: 'Bring dessert.' }),
    ev(0, '20:00', '20:30', 'Bath + books', ['junia']),

    // Tomorrow → +6
    allDay(1, 3, 'Austin in Seattle', ['austin'], { loc: 'Downtown hotel' }),
    ev(1, '07:00', '07:45', 'Gym', ['jenna'], { loc: 'Downtown Y' }),
    ev(1, '08:15', '08:40', 'School drop-off', ['jenna'], { travel: 10 }),
    ev(1, '10:30', '11:15', 'Vet appointment', ['jenna'], { travel: 10, loc: 'Animal clinic' }),
    ev(1, '15:30', '16:30', 'Art club', ['eliza'], { loc: 'School' }),
    ev(1, '16:00', '18:00', 'Playdate with Leo', ['junia'], { travel: 8, loc: "Leo's house" }),
    ev(1, '19:00', '21:00', 'Book club', ['jenna'], { travel: 10, loc: "Priya's" }),

    ev(2, '09:00', '14:00', 'Museum trip', ['eliza'], { loc: 'Downtown museum' }),
    ev(2, '13:00', '13:45', 'Haircuts', ['amelia', 'junia'], { travel: 10, loc: 'Snip Snip Kids' }),
    ev(2, '16:30', '18:00', 'Soccer practice', ['amelia'], { travel: 20, loc: 'Soccer fields' }),
    ev(2, '18:00', '19:30', 'Pizza night', ALL),

    ev(3, '10:00', '10:45', 'Swim lessons', ['junia'], { travel: 12, loc: 'City pool' }),
    ev(3, '11:00', '12:00', 'Grocery run', ['jenna']),
    ev(3, '13:00', '15:30', "Zoe's birthday party", ['eliza'], { travel: 15, loc: 'Pottery studio' }),
    ev(3, '19:00', '21:00', 'Movie night', ALL),

    ev(4, '10:30', '12:00', 'Sunday brunch', ALL, { travel: 15, loc: 'Fairhaven' }),
    ev(4, '17:05', '18:20', 'Flight home · SEA', ['austin'], { loc: 'SEA → BLI' }),

    ev(5, '07:00', '07:45', 'Gym', ['jenna']),
    ev(5, '15:45', '16:30', 'Piano lesson', ['junia'], { travel: 12 }),
    ev(5, '16:30', '18:00', 'Soccer practice', ['amelia'], { travel: 20 }),
    ev(5, '19:00', '20:00', 'Yoga', ['jenna']),

    allDay(6, 2, 'Grandma visits', ALL),
    ev(6, '09:00', '09:45', 'Dentist', ['eliza'], { travel: 15, loc: 'Bellingham Dental' }),
    ev(6, '16:30', '18:00', 'Soccer practice', ['amelia'], { travel: 20 })
  ];

  // Background recurring events so the month view has texture
  for (var d = -40; d <= 45; d++) {
    if (d >= 0 && d <= 6) continue;
    var dow = new Date(at(d, '00:00')).getDay();
    if (dow === 1) events.push(ev(d, '15:45', '16:30', 'Piano lesson', ['junia']));
    if (dow === 2 || dow === 4) events.push(ev(d, '16:30', '18:00', 'Soccer practice', ['amelia']));
    if (dow === 3) events.push(ev(d, '19:00', '20:00', 'Yoga', ['jenna']));
    if (dow === 6) events.push(ev(d, '10:00', '10:45', 'Swim lessons', ['junia']));
    if (dow === 0) events.push(ev(d, '17:30', '19:30', 'Sunday dinner', ALL));
    if (dow === 5 && d % 2 === 0) events.push(ev(d, '18:00', '19:30', 'Pizza night', ALL));
    if (d % 9 === 0) events.push(ev(d, '12:00', '13:00', 'Lunch meeting', ['austin']));
    if (d % 11 === 0) events.push(ev(d, '09:00', '10:00', 'Doctor', ['jenna']));
  }
  events.push(allDay(-8, 3, 'Camping weekend', ALL));

  // Extra events for the "overloaded day" demo
  var busyExtras = [
    ev(0, '10:00', '11:00', 'Plumber window', ['jenna']),
    ev(0, '11:00', '11:30', 'Call with bank', ['austin']),
    ev(0, '14:30', '15:30', 'Library volunteer', ['jenna']),
    ev(0, '15:30', '16:00', 'Snack prep', ['amelia']),
    ev(0, '16:00', '16:45', 'Math tutor', ['junia']),
    ev(0, '16:15', '17:00', 'Swim make-up', ['junia'], { travel: 10 }),
    ev(0, '19:45', '20:30', 'Bake sale prep', ['amelia', 'jenna']),
    ev(0, '20:30', '21:30', 'Hockey', ['austin'], { travel: 15 })
  ];

  // ---------------------------------------------------------------- shopping
  var stores = [{ id: 'grocer', name: 'FreshCo' }, { id: 'costco', name: 'Costco' }];
  var catOrder = {
    all: ['Produce', 'Bakery', 'Meat & Fish', 'Dairy & Eggs', 'Pantry', 'Frozen', 'Snacks', 'Household'],
    grocer: ['Produce', 'Bakery', 'Meat & Fish', 'Dairy & Eggs', 'Pantry', 'Frozen', 'Snacks', 'Household'],
    costco: ['Household', 'Pantry', 'Snacks', 'Dairy & Eggs', 'Meat & Fish', 'Frozen', 'Produce', 'Bakery']
  };
  var gid = 0;
  function g(name, cat, qty, store, done, note) {
    return { id: 'g' + (++gid), name: name, cat: cat, qty: qty, store: store, done: !!done, note: note || '' };
  }
  var groceries = [
    g('Bananas', 'Produce', 1, 'grocer', false, 'Bunch, not too ripe'),
    g('Baby spinach', 'Produce', 1, 'grocer'),
    g('Avocados', 'Produce', 3, 'grocer'),
    g('Honeycrisp apples', 'Produce', 6, 'grocer'),
    g('Sourdough loaf', 'Bakery', 1, 'grocer'),
    g('Bagels', 'Bakery', 2, 'costco', false, 'Everything'),
    g('Chicken thighs', 'Meat & Fish', 1, 'grocer', false, 'Boneless'),
    g('Salmon fillets', 'Meat & Fish', 2, 'grocer'),
    g('Milk 2%', 'Dairy & Eggs', 2, 'costco'),
    g('Eggs', 'Dairy & Eggs', 1, 'costco', false, '2 dozen'),
    g('Greek yogurt', 'Dairy & Eggs', 1, 'grocer'),
    g('Aged cheddar', 'Dairy & Eggs', 1, 'grocer'),
    g('Rigatoni', 'Pantry', 2, 'grocer'),
    g('Olive oil', 'Pantry', 1, 'costco'),
    g('Coffee beans', 'Pantry', 1, 'grocer', false, 'Dark roast'),
    g('Frozen peas', 'Frozen', 1, 'grocer'),
    g('Waffles', 'Frozen', 1, 'grocer'),
    g('Goldfish crackers', 'Snacks', 1, 'costco'),
    g('Granola bars', 'Snacks', 1, 'grocer'),
    g('Paper towels', 'Household', 1, 'costco'),
    g('Dish soap', 'Household', 1, 'grocer'),
    g('Lemons', 'Produce', 2, 'grocer', true),
    g('Butter', 'Dairy & Eggs', 1, 'grocer', true),
    g('Tortillas', 'Bakery', 1, 'grocer', true)
  ];
  var catalog = [
    ['Apples', 'Produce'], ['Avocados', 'Produce'], ['Bananas', 'Produce'], ['Baby spinach', 'Produce'], ['Blueberries', 'Produce'],
    ['Broccoli', 'Produce'], ['Carrots', 'Produce'], ['Cucumber', 'Produce'], ['Garlic', 'Produce'], ['Grapes', 'Produce'],
    ['Lemons', 'Produce'], ['Limes', 'Produce'], ['Onions', 'Produce'], ['Potatoes', 'Produce'], ['Strawberries', 'Produce'],
    ['Tomatoes', 'Produce'], ['Bread', 'Bakery'], ['Bagels', 'Bakery'], ['Croissants', 'Bakery'], ['Sourdough loaf', 'Bakery'],
    ['Tortillas', 'Bakery'], ['Hamburger buns', 'Bakery'], ['Bacon', 'Meat & Fish'], ['Chicken breasts', 'Meat & Fish'],
    ['Chicken thighs', 'Meat & Fish'], ['Ground beef', 'Meat & Fish'], ['Salmon fillets', 'Meat & Fish'], ['Shrimp', 'Meat & Fish'],
    ['Butter', 'Dairy & Eggs'], ['Cheddar', 'Dairy & Eggs'], ['Cream cheese', 'Dairy & Eggs'], ['Eggs', 'Dairy & Eggs'],
    ['Greek yogurt', 'Dairy & Eggs'], ['Milk 2%', 'Dairy & Eggs'], ['Oat milk', 'Dairy & Eggs'], ['Parmesan', 'Dairy & Eggs'],
    ['Black beans', 'Pantry'], ['Cereal', 'Pantry'], ['Coffee beans', 'Pantry'], ['Flour', 'Pantry'], ['Honey', 'Pantry'],
    ['Maple syrup', 'Pantry'], ['Olive oil', 'Pantry'], ['Pasta sauce', 'Pantry'], ['Peanut butter', 'Pantry'], ['Rice', 'Pantry'],
    ['Rigatoni', 'Pantry'], ['Spaghetti', 'Pantry'], ['Sugar', 'Pantry'], ['Tea', 'Pantry'], ['Frozen peas', 'Frozen'],
    ['Frozen berries', 'Frozen'], ['Ice cream', 'Frozen'], ['Pizza', 'Frozen'], ['Waffles', 'Frozen'], ['Chips', 'Snacks'],
    ['Crackers', 'Snacks'], ['Dark chocolate', 'Snacks'], ['Goldfish crackers', 'Snacks'], ['Granola bars', 'Snacks'],
    ['Popcorn', 'Snacks'], ['Dish soap', 'Household'], ['Dishwasher pods', 'Household'], ['Garbage bags', 'Household'],
    ['Laundry detergent', 'Household'], ['Paper towels', 'Household'], ['Toilet paper', 'Household'], ['Toothpaste', 'Household']
  ];
  var usuals = ['Milk 2%', 'Eggs', 'Bananas', 'Bread', 'Apples', 'Coffee beans', 'Greek yogurt', 'Cheddar', 'Butter', 'Baby spinach', 'Chicken thighs', 'Paper towels'];

  // ---------------------------------------------------------------- home control
  var rooms = [
    { id: 'kitchen', name: 'Kitchen' },
    { id: 'living', name: 'Living Room' },
    { id: 'entry', name: 'Entry + Garage' },
    { id: 'upstairs', name: 'Upstairs' },
    { id: 'yard', name: 'Backyard' }
  ];
  var devices = [
    { id: 'k-pend', room: 'kitchen', type: 'light', name: 'Pendants', on: true, level: 80 },
    { id: 'k-under', room: 'kitchen', type: 'light', name: 'Under Cabinet', on: true, level: 55 },
    { id: 'k-island', room: 'kitchen', type: 'light', name: 'Island', on: false, level: 100 },
    { id: 'k-speaker', room: 'kitchen', type: 'blind', name: 'Window Shade', pos: 100 },
    { id: 'l-lamp', room: 'living', type: 'light', name: 'Floor Lamp', on: true, level: 45 },
    { id: 'l-ceil', room: 'living', type: 'light', name: 'Ceiling', on: false, level: 100 },
    { id: 'l-blinds', room: 'living', type: 'blind', name: 'Blinds', pos: 60 },
    { id: 'l-fire', room: 'living', type: 'light', name: 'Mantel', on: false, level: 70 },
    { id: 'e-door', room: 'entry', type: 'lock', name: 'Front Door', locked: true },
    { id: 'e-porch', room: 'entry', type: 'light', name: 'Porch', on: true, level: 100 },
    { id: 'g-door', room: 'entry', type: 'garage', name: 'Garage', state: 'closed' },
    { id: 'g-side', room: 'entry', type: 'lock', name: 'Side Door', locked: true },
    { id: 'u-amelia', room: 'upstairs', type: 'light', name: "Amelia's Lamp", on: true, level: 30 },
    { id: 'u-junia', room: 'upstairs', type: 'light', name: "Junia's Nightlight", on: false, level: 15 },
    { id: 'u-hall', room: 'upstairs', type: 'light', name: 'Hallway', on: false, level: 60 },
    { id: 'u-bath', room: 'upstairs', type: 'light', name: 'Bathroom', on: false, level: 100 },
    { id: 'y-string', room: 'yard', type: 'light', name: 'String Lights', on: false, level: 100, flaky: true },
    { id: 'y-back', room: 'yard', type: 'lock', name: 'Back Door', locked: true },
    { id: 'y-flood', room: 'yard', type: 'light', name: 'Floodlight', on: false, level: 100 }
  ];
  var climate = { current: 20.5, set: 21.5, mode: 'heat', humidity: 42, outside: 14 };
  var media = { room: 'Kitchen', title: 'Harvest Moon', artist: 'Neil Young', playing: true, volume: 35, seed: 'harvest-vinyl' };
  var cameras = [
    { id: 'c-front', name: 'Front Porch', seed: 'porch-steps' },
    { id: 'c-drive', name: 'Driveway', seed: 'driveway-maple' },
    { id: 'c-yard', name: 'Backyard', seed: 'garden-yard' }
  ];
  var scenes = [
    { id: 'morning', name: 'Morning', icon: 'sunrise', set: { 'k-pend': 100, 'k-under': 80, 'l-blinds': 100, 'l-lamp': 0, 'u-hall': 60 } },
    { id: 'dinner', name: 'Dinner', icon: 'utensils', set: { 'k-pend': 55, 'k-under': 30, 'k-island': 70, 'l-lamp': 40, 'l-ceil': 0 } },
    { id: 'movie', name: 'Movie', icon: 'film', set: { 'k-pend': 0, 'k-under': 15, 'k-island': 0, 'l-lamp': 15, 'l-ceil': 0, 'l-blinds': 0, 'l-fire': 30 } },
    { id: 'away', name: 'Away', icon: 'away', set: { 'k-pend': 0, 'k-under': 0, 'k-island': 0, 'l-lamp': 0, 'l-ceil': 0, 'l-fire': 0, 'u-amelia': 0, 'u-hall': 0, 'e-porch': 100 } },
    { id: 'night', name: 'Goodnight', icon: 'moon', set: { 'k-pend': 0, 'k-under': 10, 'k-island': 0, 'l-lamp': 0, 'l-ceil': 0, 'l-fire': 0, 'u-hall': 10, 'u-junia': 15, 'e-porch': 0 } }
  ];

  // ---------------------------------------------------------------- weather (index = hour of day, °F)
  // Demo fallback only; js/weather.js replaces it with Open-Meteo data on load.
  var weather = {
    hi: 63, lo: 46, feels: 28, humidity: 71, wind: 18,
    t: [48, 48, 46, 46, 46, 46, 48, 50, 52, 54, 55, 59, 61, 63, 61, 59, 57, 55, 54, 54, 52, 50, 50, 48],
    c: ['moon', 'moon', 'moon', 'moon', 'moon', 'moon', 'partly', 'partly', 'sun', 'sun', 'sun', 'partly', 'partly', 'cloud', 'cloud', 'cloud', 'rain', 'rain', 'rain', 'rain', 'cloud', 'cloud', 'moon', 'moon'],
    p: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5, 5, 10, 20, 25, 40, 80, 90, 70, 55, 20, 10, 0, 0]
  };

  // ---------------------------------------------------------------- photos
  var t = new Date(base);
  var mmdd = ('0' + (t.getMonth() + 1)).slice(-2) + '-' + ('0' + t.getDate()).slice(-2);
  var photos = [
    { seed: 'tofino-surf', o: 'l', date: '2021-' + mmdd, place: 'Tofino, BC', from: 'jenna', tag: 'tofino' },
    { seed: 'cottage-dock', o: 'l', date: '2023-08-12', place: 'Lake of Bays', from: 'austin', tag: 'cottage' },
    { seed: 'amelia-kite', o: 'p', date: '2024-05-19', place: 'Humber Bay Park', from: 'jenna', tag: 'spring24' },
    { seed: 'junia-kite', o: 'p', date: '2024-05-19', place: 'Humber Bay Park', from: 'austin', tag: 'spring24' },
    { seed: 'autumn-walk', o: 'l', date: '2022-10-09', place: 'High Park', from: 'austin', tag: 'fall22' },
    { seed: 'birthday-cake', o: 'p', date: '2025-10-12', place: 'Home', from: 'jenna', tag: 'bday25' },
    { seed: 'candles-lit', o: 'p', date: '2025-10-12', place: 'Home', from: 'austin', tag: 'bday25' },
    { seed: 'mountain-lake', o: 'l', date: '2019-' + mmdd, place: 'Banff, AB', from: 'austin', tag: 'banff' },
    { seed: 'snow-day', o: 'l', date: '2024-01-21', place: 'Riverdale Hill', from: 'jenna', tag: 'winter24' },
    { seed: 'beach-dunes', o: 'l', date: '2023-07-02', place: 'Sandbanks', from: 'amelia', tag: 'sandbanks' },
    { seed: 'city-night', o: 'l', date: '2022-12-18', place: 'Nathan Phillips Sq.', from: 'jenna', tag: 'xmas22' },
    { seed: 'garden-bloom', o: 'p', date: '2025-06-08', place: 'Backyard', from: 'junia', tag: 'garden' },
    { seed: 'tomato-haul', o: 'p', date: '2025-06-08', place: 'Backyard', from: 'amelia', tag: 'garden' },
    { seed: 'road-trip', o: 'l', date: '2024-08-04', place: 'Cabot Trail, NS', from: 'austin', tag: 'ns' },
    { seed: 'campfire', o: 'l', date: '2024-08-06', place: 'Cape Breton', from: 'jenna', tag: 'ns' },
    { seed: 'forest-path', o: 'l', date: '2020-09-26', place: 'Algonquin', from: 'austin', tag: 'algonquin' },
    { seed: 'pancakes', o: 'p', date: '2026-03-14', place: 'Home', from: 'amelia', tag: 'pancakes' },
    { seed: 'sugar-shack', o: 'p', date: '2026-03-14', place: 'Sugar Shack', from: 'jenna', tag: 'pancakes' },
    { seed: 'harbour-sail', o: 'l', date: '2025-07-19', place: 'Toronto Harbour', from: 'junia', tag: 'sail' },
    { seed: 'pumpkins', o: 'l', date: '2025-10-25', place: "Chudleigh's", from: 'amelia', tag: 'fall25' }
  ];

  // ---------------------------------------------------------------- meals (edit your week here)
  // day: 0 = Sunday … 6 = Saturday. cook: who is on duty that night.
  var meals = [
    { day: 0, name: 'Roast chicken', side: 'Mashed potatoes + greens', cook: 'Dad' },
    { day: 1, name: 'Tacos', side: 'Rice + beans', cook: 'Dad' },
    { day: 2, name: 'Pasta night', side: 'Garlic bread + salad', cook: 'Mom' },
    { day: 3, name: 'Stir-fry', side: 'Jasmine rice', cook: 'Dad' },
    { day: 4, name: 'Pizza night', side: 'Caesar salad', cook: 'Together' },
    { day: 5, name: 'Leftovers', side: 'Clean out the fridge', cook: '—' },
    { day: 6, name: 'Breakfast for dinner', side: 'Pancakes + fruit', cook: 'Dad' }
  ];

  return {
    people: people, family: family, ALL: ALL,
    events: events, busyExtras: busyExtras,
    stores: stores, catOrder: catOrder, groceries: groceries, catalog: catalog, usuals: usuals,
    rooms: rooms, devices: devices, climate: climate, media: media, cameras: cameras, scenes: scenes,
    weather: weather, photos: photos, meals: meals,
    _gid: function () { return 'g' + (++gid); },
    _eid: function () { return 'e' + (++n); }
  };
})();
