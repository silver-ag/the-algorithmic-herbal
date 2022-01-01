// if you're reading this, I apologise. it was kind of coherant until about halfway through, now it's haemorraging special cases

function randompage() {
  document.getElementById('page').value =  Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
}

function generate() {
  var rng = mulberry32(document.getElementById('page').valueAsNumber);
  var flower = make_flower(rng);
  // illustration
  front_view = document.getElementById('frontview');
  front_view.innerHTML = '';
  draw_tepals(front_view, flower['sepals']['number'], flower['heart']*20, flower['sepals']['length'], flower['sepals']['width'], flower['sepals']['bulge position'],
              colour_to_htmlcolour(flower['sepals']['colour'], flower['sepals']['brightness']));
  draw_tepals(front_view, flower['petals']['number'], flower['heart']*20, flower['petals']['length'], flower['petals']['width'], flower['petals']['bulge position'],
              colour_to_htmlcolour(flower['petals']['colour'], flower['petals']['brightness']));
  draw_stamen_or_pistils(front_view, flower['stamen']['number'], flower['heart']*10, (flower['stamen']['number']>flower['petals']['number']?2:1), colour_to_htmlcolour(flower['stamen']['colour'], flower['stamen']['brightness']));
  draw_stamen_or_pistils(front_view, flower['pistils']['number'], flower['heart']*15, (flower['pistils']['number']>flower['petals']['number']?2:1), colour_to_htmlcolour(flower['pistils']['colour'], flower['pistils']['brightness']));
  front_view.innerHTML = front_view.innerHTML; // force redraw of svg
  // description
  description = flower_properties(flower, rng);
  document.getElementById('name').textContent = flower['name'];
  description_string = `<p>${flower['name']} is a ${description['size']} flower with ${description['colour']} petals. its habitat is ${description['habitat']}, and it is usually found in ${description['season']}.</p>`;
  description['uses'].sort((a,b)=>{return rng()>0.5});
  if (description['uses'].length > 0) {
    description_string += `its uses include ${description['uses'][0]}`;
    if (description['uses'].length > 1 && rng()>0.5) {
      description_string += ` and ${description['uses'][1]}.</p>`;
    } else {
      description_string += '.</p>';
    }
  }
  document.getElementById('description').innerHTML = description_string;
  console.log(flower);
}

function make_flower(rng) {
  var flower = {
    'name' : generate_name(rng),
    'heart' : rng(),
    'petals' : generate_petals(rng),
    'sepals' : generate_sepals(rng),
  }
  flower['name'] = flower['name'].replace(':colour:', flower['petals']['colour']);
  flower['name'] = flower['name'].replace(':fancycolour:', colours[flower['petals']['colour']][{'light':0,'medium':1,'dark':2}[flower['petals']['brightness']]]);
  flower['pistils'] = generate_pistils_or_stamen(rng, flower['petals']['colour'], flower['petals']['brightness']);
  flower['stamen'] = generate_pistils_or_stamen(rng, flower['petals']['colour'], flower['petals']['brightness']);
  return flower;
}

function generate_name(rng) {
  if (rng() > 0.5) {
    // common name
    var core = name_words[between(rng, 0, name_words.length)];
    var embellishment = rng();
    if (embellishment < 1/3) { // prefix
      return prefix_words[between(rng, 0, prefix_words.length)] + ' ' + core;
    } else if (embellishment < 2/3) { // suffix
      return core + suffix_words[between(rng, 0, suffix_words.length)];
    } else { // both
      return prefix_words[between(rng, 0, prefix_words.length)] + ' ' + core + suffix_words[between(rng, 0, suffix_words.length)];
    }
  } else {
    // fancy name
    var length = between(rng, 1, 3);
    var core = name_start[between(rng, 0, name_start.length)];
    for (var i = 0; i < length; i++) {
      core = core + name_syllables[between(rng, 0, name_syllables.length)];
    }
    core += name_ends[between(rng, 0, name_ends.length)];
    if (rng() < 0.4) { // prefix
      return prefix_words[between(rng, 0, prefix_words.length)] + ' ' + core;
    } else { // nothing
      return core;
    }
  }
}

function generate_petals(rng) {
  return {
    'number' : between(rng, 3, 12),
    'length' : rng(),
    'width' : rng(),
    'bulge position': rng(),
    'colour' : Object.keys(colours)[between(rng,0,Object.keys(colours).length - 1)], // -1 to avoid picking green
    'brightness' : ['light', 'medium', 'dark'][between(rng,0,3)]
  }
}
function generate_sepals(rng) {
  return {
    'number' : between(rng, 3, 12),
    'length' : rng(),
    'width' : rng(),
    'bulge position': rng(),
    'colour' : (rng()>0.5 ? 'green' : Object.keys(colours)[between(rng,0,Object.keys(colours).length)]),
    'brightness' : ['light', 'medium', 'dark'][between(rng,0,3)]
  }
}
function generate_pistils_or_stamen(rng, petal_colour, petal_brightness) {
  return {
    'number': between(rng, 0, 15),
    'colour': (rng()>0.5?'black':petal_colour),
    'brightness': ['light', 'medium', 'dark'].filter((v)=>v!=petal_brightness)[between(rng,0,1)]
  }
}

function draw_tepals(svg, number, central_radius, length, width, bulge_position, colour) {
  width = width*0.7; // if it's too big and tepals are bipartite the lobes can overlap with those next to the and it doesn't look very good
  var centre = [svg.getAttribute('width')/2, svg.getAttribute('height')/2];
  var angle = (2*Math.PI)/number;
  var tepal_path = document.createElement('path');
  var tepal_base_vertices = [];
  for (var i = 0; i < number; i++) {
    tepal_base_vertices.push([centre[0]+(central_radius*Math.sin(angle*i)), centre[1]+(central_radius*Math.cos(angle*i))]);
  }
  tepal_path.setAttribute('d', 'M' + tepal_base_vertices[0][0] + ' ' + tepal_base_vertices[0][1]);
  tepal_path.setAttribute('fill', colour);
  tepal_path.setAttribute('stroke', 'black');
  for (var i = 0; i < number; i++) {
    var to_x = tepal_base_vertices[i][0]+(Math.sin(angle*(i+0.5))*(centre[0]-central_radius)*length);
    var to_y = tepal_base_vertices[i][1]+(Math.cos(angle*(i+0.5))*(centre[1]-central_radius)*length);
    var bulge_x_a = tepal_base_vertices[i][0]+(Math.sin(angle*(i+0.5-width))*(centre[0]-central_radius)*bulge_position);
    var bulge_y_a = tepal_base_vertices[i][1]+(Math.cos(angle*(i+0.5-width))*(centre[1]-central_radius)*bulge_position);
    var bulge_x_b = tepal_base_vertices[i][0]+(Math.sin(angle*(i+0.5+width))*(centre[0]-central_radius)*bulge_position);
    var bulge_y_b = tepal_base_vertices[i][1]+(Math.cos(angle*(i+0.5+width))*(centre[1]-central_radius)*bulge_position);
    tepal_path.setAttribute('d', tepal_path.getAttribute('d') + ' Q' + bulge_x_a + ' ' + bulge_y_a +' ' + to_x + ' ' + to_y);
    tepal_path.setAttribute('d', tepal_path.getAttribute('d') + ' Q' + bulge_x_b + ' ' + bulge_y_b +' ' + tepal_base_vertices[(i+1)%number][0] + ' ' + tepal_base_vertices[(i+1)%number][1]);
    // debugging
    /*testdotto = document.createElement('circle');
    testdotto.setAttribute('cx', to_x);
    testdotto.setAttribute('cy',to_y);
    testdotto.setAttribute('r',2);
    testdotto.setAttribute('fill','blue');
    svg.appendChild(testdotto);
    testdota = document.createElement('circle');
    testdota.setAttribute('cx',bulge_x_a);
    testdota.setAttribute('cy',bulge_y_a);
    testdota.setAttribute('r',2);
    svg.appendChild(testdota);
    testdotb = document.createElement('circle');
    testdotb.setAttribute('cx',bulge_x_b);
    testdotb.setAttribute('cy',bulge_y_b);
    testdotb.setAttribute('r',2);
    svg.appendChild(testdotb);*/
  }
  svg.appendChild(tepal_path);
}

function draw_stamen_or_pistils(svg, number, radius, layers, colour) {
  var centre = [svg.getAttribute('width')/2, svg.getAttribute('height')/2];
  if (number == 1) {
    item = document.createElement('circle');
    item.setAttribute('cx', centre[0]);
    item.setAttribute('cy', centre[1]);
    item.setAttribute('r', 4);
    item.setAttribute('fill', colour);
    svg.appendChild(item);
  } else {
    var angle = (Math.PI*2)/(number/layers);
    for (var l = 0; l < layers; l++) {
      for (var i = 0; i < number/layers; i++) {
        item = document.createElement('circle');
        item.setAttribute('cx', centre[0]+((radius+(l*3))*Math.sin((i+(l*Math.PI))*angle)));
        item.setAttribute('cy', centre[1]+((radius+(l*3))*Math.cos((i+(l*Math.PI))*angle)));
        item.setAttribute('r', 2);
        item.setAttribute('fill', colour);
        svg.appendChild(item);
      }
    }
  }
}

prefix_words = ["pauper's", "saint's", "squirrel's", "lady's",  "bishop's", "lover's", 'crow', ':fancycolour:', ':fancycolour:', ':fancycolour:', 'sweet', 'bitter', 'false', 'true', 'meadow', 'rough', 'hairy', 'river'];
name_words = ['glass', 'bell', 'star', 'hood', 'hoof', 'lace', 'crown', 'balm', ':colour:', ':colour:'];
suffix_words = ['weed', 'flower', 'bloom', 'leaf', ' of the mountain', ' of winter', 'wort'];
name_start = ['l', 'ch', 'ru', 'rho', 'th', 'ir']
name_syllables = ['yr', 'ea', 'ell', 'itt', 'yl', 'as'];
name_ends = ['ia', 'ess'];
colours = {
  'blue': ['sky', 'azure', 'deepwater'],
  'white': ['pure', 'cloudy', 'stormy'],
  'black': ['twilight', 'night', 'ink'],
  'red': ['blushing', 'bloody', 'velvet'],
  'yellow': ['sunny', 'golden', 'amber'],
  'robin-red': ['bright', 'sunset', 'earthy'], // ie. orange
  'purple': ['violet', 'royal', 'indigo'],

  'green': ['light', 'grass', 'dark']
}

function colour_to_htmlcolour(name, brightness) {
  return {'sky': '#3399ff', 'azure': '#0066ff', 'deepwater': '#000066',
          'pure': '#f5f5f5', 'cloudy': '#c0c0c0', 'stormy': '#a0a0a0',
          'twilight': '#404040', 'night': '#202020', 'ink': '#050505',
          'blushing': '#ff6699', 'bloody': '#cc0000', 'velvet': '#800000',
          'sunny': '#ffff66', 'golden': '#ffcc00', 'amber': '#cc9900',
          'bright': '#ff9933', 'sunset': '#ff6600', 'earthy': '#cc3300',
          'violet': '#cc0066', 'royal': '#993399', 'indigo': '#9933ff',
          'light': '#99ff66', 'grass': '#009900', 'dark': '#00cc00'}[colours[name][{'light':0,'medium':1,'dark':2}[brightness]]];
}

function flower_properties(flower, rng) {
  properties = {'size':'medium', 'taste':'unremarkable', 'uses': [], 'habitat': 'widespread', 'season': 'all seasons',
                'adjective': 'pretty', 'colour': (flower['petals']['brightness']=='medium'?'':flower['petals']['brightness']+' ')+flower['petals']['colour'].replace('robin-red','orange')};
  if (Math.max(flower['petals']['length'],flower['sepals']['length']) > 0.7) {
    properties['size'] = 'large';
  } else if (Math.max(flower['petals']['length'],flower['sepals']['length']) < 0.3) {
    properties['size'] = 'small';
  }
  if (flower['name'].includes('bitter') || rng()<0.1) {
    properties['taste'] = ['bitter', 'unpleasant', 'astringent', 'hot'][between(rng,0,4)];
    properties['uses'].push(['as an insect repellent', 'cleaning injuries'][between(rng,0,2)]);
  }
  if (flower['name'].includes('sweet') || rng()<0.1) {
    properties['taste'] = ['sweet', 'fresh', 'clear', 'good'][between(rng,0,4)];
    properties['uses'].push(['flavouring food', 'flavouring drink'][between(rng,0,2)]);
  }
  if (flower['name'].includes('mountain') || (properties['size']=='small' && rng()>0.5)) {
    properties['habitat'] = 'high, remote areas';
  } else if (flower['name'].includes('meadow') || flower['name'].includes('field')) {
    properties['habitat'] = 'fields and farmlands';
  } else if (properties['size']=='large' && !flower['name'].includes('winter') && rng()<0.6) {
    properties['habitat'] = 'hot climates';
  }
  if (flower['name'].includes('winter')) {
    properties['season'] = 'winter';
  } else if (properties['habitat'] == 'hot climates') {
    properties['season'] = ['all seasons', 'spring', 'summer'][between(rng,0,3)];
  } else {
    properties['season'] = ['all seasons', 'spring', 'summer', 'autumn', 'winter'][between(rng,0,5)];
  }
  if (rng()<0.1) {
    properties['uses'].push(['as a traditional gift', 'as a token of love', 'in tanning leather', 'feeding animals', 'seasonal decoration', 'keeping food fresh'][between(rng,0,6)]);
  }
  properties['adjective'] = [properties['size'], 'pretty', 'rare', 'popular'][between(rng,0,4)];
  return properties;
}

// a prng that can be seeded https://stackoverflow.com/questions/521295
function mulberry32(a) {
    return function() {
      var t = a += 0x6D2B79F5;
      t = Math.imul(t ^ t >>> 15, t | 1);
      t ^= t + Math.imul(t ^ t >>> 7, t | 61);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }
}

function between(rng, min, max) {
  // min is inclusive, max is exclusive
  return min + Math.floor(rng() * (max - min));
}
