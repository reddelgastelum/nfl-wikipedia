const cheerio = require('cheerio');
const request = require('sync-request');
const sleep = require('sleep');

module.exports = {
  team:team,
  stadium:stadium,
  player:player,
  teams:teams
}

var teams = [
  "Arizona Cardinals",
  "Atlanta Falcons",
  "Baltimore Ravens",
  "Buffalo Bills",
  "Carolina Panthers",
  "Chicago Bears",
  "Cincinnati Bengals",
  "Cleveland Browns",
  "Dallas Cowboys",
  "Denver Broncos",
  "Detroit Lions",
  "Green Bay Packers",
  "Houston Texans",
  "Indianapolis Colts",
  "Jacksonville Jaguars",
  "Kansas City Chiefs",
  "Los Angeles Chargers",
  "Los Angeles Rams",
  "Miami Dolphins",
  "Minnesota Vikings",
  "New England Patriots",
  "New York Jets",
  "New York Giants",
  "New Orleans Saints",
  "Oakland Raiders",
  "Philadelphia Eagles",
  "Pittsburgh Steelers",
  "San Francisco 49ers",
  "Seattle Seahawks",
  "Tampa Bay Buccaneers",
  "Tennessee Titans",
  "Washington Redskins"
];

function cheerquest(url, delay, callback) {
  var result = {};

  sleep.msleep(delay);

  var res = request('GET', url);
  var $ = cheerio.load(res.getBody());

  return callback($, res);
}

function team(t, callback) {
  var team = {};
  var url = 'https://en.wikipedia.org/wiki/' + t.split(' ').join('_');
  cheerquest(url, 1100, function($, res) {
    if (res.statusCode == 200) {

      var infobox = $('.infobox').html();
      var row = $(infobox).find('th');
      // Fullname
      team.fullname = $(infobox).find('tbody > tr > th').first().text();
      // City
      var splitname = team.fullname.split(' ');
      if (splitname.length == 3) {
        // City
        team.city = splitname[0] + ' ' + splitname[1];
        // Code
        if (team.city == 'Los Angeles' || team.city == 'New York') {
          team.code = splitname[0][0] + splitname[1][0] + splitname[2][0];
        } else {
          team.code = splitname[0][0] + splitname[1][0];
        }
      } else {
        // City
        team.city = splitname[0];
        // Code
        if (team.city == 'Jacksonville') {
          team.code = 'JAX';
        } else {
          team.code = team.city.slice(0, 3).toUpperCase();
        }
      }
      // Name
      team.name = splitname[splitname.length - 1];

      // Conference and Division
      row = $(infobox).find('tbody > tr > th');
      $(row).each(function(i, elem) {
        if (($(this).text()).startsWith('League/conference affiliations')) {
          var next = $(this).parent().next().html();
          var con = $(next).find('td > div > ul > li > ul > li > b').text();
          if (con.startsWith('North')) {
            team.conference = 'NFC';
            team.division = 'North';
          } else {
            var conSplit = con.split(' ');
            team.conference = conSplit[0];
            team.division = conSplit[1];
          }
        }
      });

      function getDetails(type) {
        var result;
        var row = $(infobox).find("th");
        $(row).each(function(i, elem) {
          if (($(this).text()).startsWith(type)) {
            result = $(this).siblings().text();
          }
        });

        return result;
      }

      // Owner
      team.owner = getDetails('Owner');
      // President
      team.president = getDetails('President');
      if (team.president == undefined) {
        team.president = getDetails('Chairman');
        if (team.president == undefined) {
          team.president = getDetails('CEO');
        }
      }
      // General Managers
      team.generalManager = getDetails('General manager');
      // Head coach
      team.headCoach = getDetails('Head coach');

      // Request another url to get off and def coordinators
      var newFullname = splitname.join('_');
      url = 'https://en.wikipedia.org/wiki/Template:'+newFullname+'_staff';

      cheerquest(url, 1100, function($, res) {
        if (res.statusCode == 200) {
          var table = $('.toccolours').html();
          var row = $(table).find('li');
          $(row).each(function(i, elem) {
            // Offensive Coordinator
            if (($(this).text()).startsWith('Offensive Coordinator')) {
              team.offensiveCoordinator = $(this).find('a').text();
            }
            // Defensive Coordinator
            if (($(this).text()).startsWith('Defensive Coordinator')) {
              team.defensiveCoordinator = $(this).find('a').text();
            }
            if (($(this).text()).startsWith('Chief Executive Officer')) {
              if (team.owner == undefined) {
                team.owner = $(this).find('a').text();
              }
            }
          });

          url = 'https://en.wikipedia.org/wiki/' + '2017' + '_' + newFullname + '_season';

          cheerquest(url, 1100, function($, res) {
            if (res.statusCode == 200) {
              infobox = $('.infobox').html();
              row = $(infobox).find('th');
              // Home Field
              team.homeField = getDetails('Home field');
              if (team.homeField.startsWith('Sports Authority')) {
                team.homeField = 'Sports Authority Field at Mile High';
              }
              if (team.homeField.startsWith('University of Phoenix')) {
                team.homeField = 'University of Phoenix Stadium';
              }
              if (team.homeField.startsWith('Oakland')) {
                team.homeField = 'Oakland-Alameda County Coliseum'
              }

              return callback(team);
            } else {
              console.log('That url is invalid.');
            }
          });
        } else {
          console.log('That url is invalid.');
        }
      });
    } else {
      console.log('That url is invalid.');
    }
  });
}


function stadium(homeField, callback) {
  var stadium = {};
  url = 'https://en.wikipedia.org/wiki/' + homeField.split(' ').join('_');
  cheerquest(url, 1100, function($, res) {
    if (res.statusCode == 200) {
      function getDetails(type) {
        var result;
        var row = $(infobox).find("th");
        $(row).each(function(i, elem) {
          if (($(this).text()).startsWith(type)) {
            result = $(this).siblings().text();
          }
        });

        return result;
      }

      var infobox = $('.infobox').html();
      // name
      stadium.name = $('.fn').text();
      // Address
      stadium.address = getDetails('Address');
      // Location
      stadium.location = getDetails('Location');
      // Latitude
      stadium.latitude = $('.latitude').text();
      // Longitude
      stadium.Longitude = $('.longitude').text();
      // Surface
      var surface = getDetails('Surface');
      var surfaceSplit = surface.split('\n');
      if (surfaceSplit.length > 1) {
        for (var i = 0; i < surfaceSplit.length; i++) {
          if (surfaceSplit[i].search('present') > -1) {
            surface = surfaceSplit[i];
          }
        }
      }
      var opening = surface.indexOf('(');
      if (opening > -1) {
        surface = surface.slice(0, opening);
      }
      stadium.surface = surface;

      return callback(stadium);
    } else {
      console.log('Invalid URL');
    }

  });
}


function player(t, callback) {
  var player = {};

  url = 'https://en.wikipedia.org/wiki/Template:' + t.split(' ').join('_') + '_roster';
  cheerquest(url, 1100, function($, res) {
    if (res.statusCode == 200) {
      var table = $('.toccolours').html();

      var tr = $(table).find('tbody > tr').eq(1).html();
      var links = $(tr).find('a');
      var href = '';

      links.each(function(i, elem) {
        href = $(this).attr('href');


        if (!href.endsWith('html') && !href.endsWith('svg') && !href.endsWith('rosters')) {
          if (href.startsWith('/w/')) {
            var start = href.indexOf('=');
            var end = href.indexOf('&');
            var name = href.slice(start + 1, end).split('_').join(' ');
            player.name = name;
            return callback({name:name});
          }
          url = 'https://en.wikipedia.org' + href;
          cheerquest(url, 1100, function($, res) {
            if (res.statusCode == 200) {
              var infobox = $('.infobox').html();

              player.name = $('.fn').text();

              var number = $('.org').parent().text();
              player.number = number.split(' ')[1];

              var age = $('.ForceAgeToShow').text();
              player.age = age.slice(5, -1);

              player.dob = $('.bday').text();

              function getDetails(type) {
                var result;
                var row = $(infobox).find("th");
                $(row).each(function(i, elem) {
                  if (($(this).text()).startsWith(type)) {
                    result = $(this).siblings().text();
                  }
                });
                return result;
              }

              player.height = getDetails('Height');
              player.weight = getDetails('Weight');
              player.position = getDetails('Position');
              player.placeOfBirth = getDetails('Place of birth');
              player.college = getDetails('College');
              player.draftDetails = getDetails('NFL Draft');
              player.status = getDetails('Roster status');

              return callback(player);
            } else {
              console.log('Invalid URL');
            }
          });
        }
      });
    } else {
      console.log('Invalid URL');
    }
  });
}

function getAll(teams) {
  for (var i = 0; i < teams.length; i++) {
    team(teams[i], function(team) {
      //console.log(team);

      stadium(team.homeField, function(stadium) {
        console.log(stadium);
      });
    });


    // player(teams[i], function(player) {
    //   console.log(player);
    // });
  }
}

getAll(teams);
