var COlib_loaded = false;
var COlib_version = 0.2;

var COlib = COlib || function () {

  function sendPlayer(origin, msg) {
    var dest = origin;
    if (origin.who) {
      if (playerIsGM(origin.playerid)) dest = 'GM';
      else dest = origin.who;
    }
    sendChat('<script>', '/w "' + dest + '" ' + msg);
  }

  function sendLog(msg, force) {
    force = force || false;
    if (state.COlib.logging || force) {
      if (typeof msg != 'object') {
        log('COlib | ' + msg);
      } else {
        log('COlib | <Object>');
        log(msg);
        log('COlib | </Object>');
      }
    }
  }

  function charAttr(char, attr) {
    return `@{${char}|${attr}}`;
  }

  function repeatAttr(section, index, attr) {
    if (isNaN(index)) return `repeating_${section}_${index}_${attr}`;
    else return `repeating_${section}_$${index}_${attr}`;
  }

  function charRepeatAttr(char, section, index, attr) {
    return charAttr(char, repeatAttr(section, index, attr));
  }

  function repeatCount(charId, section, attrCount) {
    var count = 0;
    var attribs = findObjs({
      _type: 'attribute',
      _characterid: charId,
    });
    var attrib;
    for (attrib = 0; attrib < attribs.length; attrib++) {
      attrName = attribs[attrib].get('name');
      if (attrName.startsWith(`repeating_${section}_`) && attrName.endsWith(`_${attrCount}`)) count++;
    }
    return count;
  }

  function repeatRowIds(charId, section) {
    var rowIds = [];
    var attribs = findObjs({
      _type: 'attribute',
      _characterid: charId,
    });
    for (var attrib = 0; attrib < attribs.length; attrib++) {
      attrName = attribs[attrib].get('name');
      if (attrName.startsWith(`repeating_${section}_`)) {
        var rowId = attrName.split('_');
        if (rowIds.indexOf(rowId[2]) === -1) rowIds.push(rowId[2]);
      }
    }
    return rowIds;
  }

  /**
   * Return an handout object
   * @param {string} name : handout name
   */
  function findHandout(name) {
    var handoutObj = findObjs({
      _type: 'handout',
      _name: name,
    }, {
      caseInsensitive: true
    })[0];
    return handoutObj;
  }

  /**
   * Return an handout hyperlink
   * @param {string} name 
   * @param {string} sequence 
   * @param {object} handoutObj 
   */
  function handoutLink(name, sequence, handoutObj) {
    var link = '';
    if (!handoutObj) handoutObj = findHandout(name);
    if (handoutObj) {
      if (sequence > 0) link = sequence.toString() + '. ';
      link = `[${link}${name}](http://journal.roll20.net/handout/${handoutObj.id})`;
    }
    return link;
  }

  /**
   * Return an ability object
   * @param {string} charId 
   * @param {string} abilityName 
   */
  function findAbility(charId, abilityName) {
    var abilityObj = findObjs({
      _type: 'ability',
      _characterid: charId,
      name: abilityName,
    }, {
      caseInsensitive: true
    })[0];
    return abilityObj;
  }

  /**
   * Return the text for an ability chat button
   * @param {string} charId 
   * @param {string} name 
   * @param {string} ability 
   * @param {number} sequence 
   * @param {object} handoutObj 
   * @param {object} abilityObj 
   */
  function abilityButton(charId, name, ability, sequence, handoutObj, abilityObj) {
    var button = '';
    if (!handoutObj) handoutObj = findHandout(name);
    if (!abilityObj) abilityObj = findAbility(charId, ability);
    if (abilityObj) {
      if (abilityObj.get('action') != '') {
        button += '[';
        if (handoutObj) {
          button += 'Jet';
        } else {
          if (sequence > 0) button += sequence.toString() + '. ';
          button += name;
        }
        button += `](~${charId}|${ability})`;
      }
    }
    return button;
  }

  /**
   * Output a list of actions to the chat
   * @param {string} charId 
   * @param {string} args 
   */
  function displayActions(charId, args) {
    var charName = getAttrByName(charId, 'character_name');
    var chatMsg = '';
    var optDesc = ''; // descriptions only
    var toGM = getAttrByName(charId, 'togm');
    var fiche = getAttrByName(charId, 'type_personnage')
    for (var a = 0; a < args.length; a++) {
      if (args[a] == '--desc') optDesc = ' --desc';
    }

    var attrNames = {
      'COF': {
        'pj': {
          atkRpt: 'armes',
          atkName: 'armenom',
          atkRoll: 'jet',
          capaRpt: 'jetcapas',
          capaName: 'jetcapanom',
          capaRoll: 'jet'
        },
        'pnj': {
          atkRpt: 'pnjatk',
          atkRoll: 'jet',
          capaRpt: 'pnjcapas',
          capaRoll: 'jet'
        }
      },
      'COC': {
        'pj': {
          atkRpt: 'armes',
          atkName: 'armenom',
          atkRoll: 'jet',
          capaRpt: 'jetcapas',
          capaName: 'jetcapanom',
          capaRoll: 'jet',
          traitRpt: 'traits',
          traitName: 'traitnom',
          traitRoll: 'trait'
        },
        'pnj': {
          atkRpt: 'pnjatk',
          atkName: 'atknom',
          atkRoll: 'jet',
          capaRpt: 'pnjcapas',
          capaName: 'capanom',
          capaRoll: 'jet'
        },
        'vehicule': {
          capaRpt: 'jetv',
          capaName: 'jetvnom',
          capaRoll: 'jetv'
        }
      },
      'CG': {
        'pj': {
          atkRpt: 'armes',
          atkName: 'armenom',
          atkRoll: 'atk',
          capaRpt: 'jetcapas',
          capaName: 'jetcapanom',
          capaRoll: 'jetcapa',
          traitRpt: 'traits',
          traitName: 'traitnom',
          traitRoll: 'trait'
        },
        'pnj': {
          atkRpt: 'pnjatk',
          atkName: 'atknom',
          atkRoll: 'atkpnj',
          capaRpt: 'pnjcapas',
          capaName: 'capanom',
          capaRoll: 'pnjcapa'
        },
        'vaisseau': {
          atkRpt: 'armesv',
          atkName: 'armenom',
          atkRoll: 'atkv'
        }
      }
    };

    var attrs = attrNames[state.COlib.universe][fiche];

    switch (args[1]) {

      // !co-actions --voies : liste des voies
      case '--voies':
        var voies = [
          'voie1nom',
          'voie2nom',
          'voie3nom',
          'voie4nom',
          'voie5nom',
          'voie6nom',
          'voie7nom',
          'voie8nom',
          'voie9nom'
        ];
        for (var voie = 0; voie < voies.length; voie++) {
          var voieNom = getAttrByName(charId, voies[voie]);
          if (voieNom != '') {
            chatMsg += `[${voie + 1}. ${voieNom}](!co-actions --voie ${voie + 1}${optDesc})\n\r`;
          }
        }
        if (chatMsg != '') {
          var w = toGM;
          if (w == '' && state.COlib.whisper) w = `/w "${charName}" `;
          chatMsg = w + `&{template:co1} {{perso=${charAttr(charName, 'character_name')}}} {{subtags=${charAttr(charName, 'PROFIL')}}} {{name=Capacités}} {{desc=${chatMsg} }}`;
        }
        break;

        // !co-actions --voie # : liste des capacités voie #
      case '--voie':
        var voie = 'voie' + args[2] + '-';
        var rangs = [voie + '1', voie + '2', voie + '3', voie + '4', voie + '5']
        for (var rang = 0; rang < rangs.length; rang++) {
          var rangNom = getAttrByName(charId, rangs[rang]);
          var abilityName = 'V' + args[2] + 'R' + (rang + 1).toString();
          var chatRang = '';
          if (rangNom != '') {
            var handoutObj = findHandout(rangNom);
            if (handoutObj) {
              chatRang += handoutLink(rangNom, rang + 1, handoutObj) + ' ';
            }
            if (optDesc != ' --desc') {
              var abilityObj = findAbility(charId, abilityName);
              if (abilityObj) {
                chatRang += abilityButton(charId, rangNom, abilityName, rang + 1, handoutObj, abilityObj);
              }
            }
            if (chatRang != '') chatMsg += chatRang + '\n\r';
          }
        }
        if (chatMsg != '') {
          var w = toGM;
          if (w == '' && state.COlib.whisper) w = `/w "${charName}" `;
          chatMsg = w + `&{template:co1} {{perso=${charName}}} {{subtags=Capacités}} {{name=${charAttr(charName, `voie${args[2]}nom`)}}} {{desc=${chatMsg} }}`;
        }
        break;

        // !co-actions --competences
      case '--competences':
        if (attrs.capaRpt === '') break;
        var competences = repeatRowIds(charId, attrs.capaRpt).length;
        if (competences > 0) {
          for (var competence = 0; competence < competences; competence++) {
            var compNom = getAttrByName(charId, repeatAttr(attrs.capaRpt, competence, attrs.capaName));
            if (compNom != '') {
              chatMsg += `[${competence + 1}. ${compNom}](~${charId}|${repeatAttr(attrs.capaRpt, competence.toString(), attrs.capaRoll)})\n\r`;
            }
          }
          if (chatMsg != '') {
            var w = toGM;
            if (w == '' && state.COlib.whisper) w = `/w "${charName}" `;
            chatMsg = w + `&{template:co1} {{perso=${charName}}} {{subtags=${charAttr(charName, 'PROFIL')}}} {{name=Compétences}} {{desc=${chatMsg} }}`;
          }
        }
        break;

        // !co-actions --attaques
      case '--attaques':
        if (attrs.atkRpt === '') break;
        var rowIds = repeatRowIds(charId, attrs.atkRpt);
        var armes = rowIds.length;
        if (armes > 0) {
          for (var arme = 0; arme < armes; arme++) {
            var armeNom = '';
            armeNom = getAttrByName(charId, repeatAttr(attrs.atkRpt, rowIds[arme], attrs.atkName));
            var atkNom = '';
            if (fiche === 'pj' || fiche === 'vaisseau') {
              atkNom = getAttrByName(charId, repeatAttr(attrs.atkRpt, rowIds[arme], 'armejetn'));
            }
            atkNom = (atkNom !== '') ? atkNom + ' ' + armeNom : armeNom;
            var atkType = getAttrByName(charId, repeatAttr(attrs.atkRpt, rowIds[arme], 'armeatk'));
            if (fiche !== 'vaisseau') {
              var portee = '';
              if (fiche !== 'pnj') portee = getAttrByName(charId, repeatAttr(attrs.atkRpt, rowIds[arme], 'armeportee'));
              if (portee != '') {
                if (atkType == '@{ATKTIR}') atkNom += ' (D:';
                if (atkType == '@{ATKMAG}') atkNom += ' (Mag:';
                if (atkType == '@{ATKMEN}') atkNom += ' (Men:';
                if (atkType == '@{ATKPSYINFLU}' || atkType == '@{ATKPSYINTUI}') atkNom += ' (Psy:';
                atkNom += portee + ')';
              } else {
                if (fiche !== 'pnj') {
                  if (atkType == '@{ATKMAG}') {
                    atkNom += ' (Mag)';
                  } else if (atkType == '@{ATKMEN}') {
                    atkNom += ' (Men)';
                  } else if (atkType == '@{ATKPSYINFLU}' || atkType == '@{ATKPSYINTUI}') {
                    atkNom += ' (Psy)';
                  } else {
                    atkNom += ' (C)';
                  }
                }
              }
            }
            if (atkNom != '') {
              chatMsg += `[${atkNom}](~${charId}|${repeatAttr(attrs.atkRpt, rowIds[arme], attrs.atkRoll)})\n\r`;
            }
          }
          if (chatMsg != '') {
            var w = toGM;
            if (w == '' && state.COlib.whisper) w = `/w "${charName}" `;
            chatMsg = w + `&{template:co1} {{perso=${charName}}} {{subtags=Combat}} {{name=Attaques}} {{desc=${chatMsg} }}`;
          }
        }
        break;

      default:
        break;
    }
    if (chatMsg != '') {
      sendLog(chatMsg);
      sendChat(`character|${charId}`, chatMsg);
    }
  }

  /**
   * Display script configuration
   */
  function configDisplay() {
    sendChat('COlib', `/w gm Univers : ${state.COlib.universe}`);
    sendChat('COlib', `/w gm Menus murmurés : ${state.COlib.whisper}`);
    sendChat('COlib', `/w gm Logs : ${state.COlib.logging}`);
  }

  /**
   * Process configuration command
   * @param {array<string>} args 
   */
  function configCOlib(args) {
    if (args.length == 1) {
      configDisplay();
      return;
    }
    switch (args[1]) {
      case '--u':
        state.COlib.universe = args[2].toUpperCase();
        break;
      case '--whisper':
        state.COlib.whisper = !state.COlib.whisper;
        configDisplay();
        break;
      case '--log':
        state.COlib.logging = !state.COlib.logging;
        configDisplay();
        break;
      default:
        break;
    }
  }

  /**
   * Process API chat commands
   * @param {string} msg 
   */
  function apiCommand(msg) {
    msg.content = msg.content.replace(/\s+/g, ' '); //remove duplicate whites
    var command = msg.content.split(' ');

    switch (command[0]) {
      case '!co-config':
        configCOlib(command);
        break;
      case '!co-actions':
        if (!msg.selected || msg.selected.length != 1) {
          tokens = (msg.selected) ? msg.selected.length : 0;
          sendChat('COlib', '\n\rPlease select a token first !');
          sendLog(`Cannot execute '${msg.content}' : ${tokens} token(s) selected`, true);
          break;
        }
        var token = getObj('graphic', msg.selected[0]._id);
        if (token) {
          var character = getObj('character', token.get('represents'));
          if (character) {
            displayActions(character.id, command);
          }
        }
        break;
      default:
        break;
    }
    return;
  }

  return {
    apiCommand: apiCommand,
  }

}();

/**
 * Wire-up initialization event
 */
on("ready", function () {

  COlib_loaded = true;
  log(`COlib version ${COlib_version} loaded`);

  if (!state.COlib) {
    state.COlib = {
      universe: 'COC',
      whisper: false,
      logging: false
    }
  }

});

/**
 * Wire-up event for API chat message
 */
on("chat:message", function (msg) {

  "use strict";
  if (!COlib_loaded) return;

  if (msg.type === 'api') COlib.apiCommand(msg);

});