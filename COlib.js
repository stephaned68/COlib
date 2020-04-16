/**
 * COlib : Chronique Oubliées library
 */

var COlib_version = 2.0;

var COlib = COlib || function () {

  /**
   * Whisper a message to a player
   * @param {string} origin 
   * @param {string} msg 
   */
  function sendPlayer(origin, msg) {
    var dest = origin;
    if (origin.who) {
      if (playerIsGM(origin.playerid)) dest = 'GM';
      else dest = origin.who;
    }
    sendChat('<script>', '/w "' + dest + '" ' + msg);
  }

  /**
   * Log a message to the debug console
   * @param {string} msg 
   * @param {boolean} force 
   */
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

  /**
   * Return the chat string for a character's attribute
   * @param {string} char 
   * @param {string} attr 
   */
  function charAttr(char, attr) {
    return `@{${char}|${attr}}`;
  }

  /**
   * Return the full name for a repeating section attribute
   * @param {string} section 
   * @param {number|string} index 
   * @param {string} attr 
   */
  function repeatAttr(section, index, attr) {
    if (isNaN(index)) return `repeating_${section}_${index}_${attr}`;
    else return `repeating_${section}_$${index}_${attr}`;
  }

  /**
   * Return the chat string for character's repeating attribute
   * @param {string} char 
   * @param {string} section 
   * @param {number|string} index 
   * @param {string} attr 
   */
  function charRepeatAttr(char, section, index, attr) {
    return charAttr(char, repeatAttr(section, index, attr));
  }

  /**
   * Return the number of rows in a repeating section
   * @param {string} charId 
   * @param {string} section 
   */
  function repeatCount(charId, section) {
    return repeatRowIds(charId, section).length; 
  }

  /**
   * Return all the row ids for a given section
   * @param {string} charId 
   * @param {string} section 
   */
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
   * Return token object for id
   * @param {string} id Token unique identifier
   * @returns {object}
   */
  function getToken(id) {
    return getObj('graphic', id);
  }

  /**
   * Return selected tokens as an array of objects
   * @param {object} msg Chat message object
   * @returns {array<object>}
   */
  function getTokens(msg) {
    const tokens = [];
    if (msg.selected) {
      msg.selected.forEach(token => {
        tokens.push(getToken(token._id));
      });
    }
    return tokens;
  }

  /**
   * Return character object for id
   * @param {string} id Character unique identifier
   * @returns {object}
   */
  function getCharacter(id) {
    return getObj('character', id);
  }

  /**
   * Return character object from token 
   * @param {object} token Token object
   * @returns {object}
   */
  function getCharacterFromToken(token) {
    if (token) {
      return character = getObj('character', token.get('represents'));
    }
    else {
      return null;
    }
  }

  /**
   * Return selected tokens as an array of character objects
   * @param {object} msg Chat message object
   * @returns {array<object>}
   */
  function getCharactersFromTokens(msg) {
    const characters = [];
    const tokens = getTokens(msg);
    tokens.forEach(token => {
      const character = getCharacterFromToken(token);
      if (character) {
        characters.push(character);
      }
    });
    return characters;
  }

  /**
   * Output the whisper command or not
   * (based on sheet and general configuration)
   * @param {string} toGM 
   * @param {string} charName 
   */
  function whisper(toGM, charName) {
    var w = toGM;
    if (w == '' && state.COlib.whisper) {
      w = `/w "${charName}" `;
    }
    return w;
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
    var fiche = getAttrByName(charId, 'type_personnage');
    var toGM = getAttrByName(charId, (fiche === 'pnj' ? 'pnj_togm' : 'togm'));
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
          atkRoll: 'pjatk',
          capaRpt: 'jetcapas',
          capaName: 'jetcapanom',
          capaSkill: 'jetcapatitre',
          capaRoll: 'pjcapa',
          traitRpt: 'traits',
          traitName: 'traitnom',
          traitRoll: 'pjtrait'
        },
        'pnj': {
          atkRpt: 'pnjatk',
          atkName: 'atknom',
          atkRoll: 'pnjatk',
          capaRpt: 'pnjcapas',
          capaName: 'capanom',
          capaRoll: 'pnjcapa'
        },
        'vehicule': {
          capaRpt: 'jetv',
          capaName: 'jetvnom',
          capaRoll: 'vehicule'
        }
      },
      'CG': {
        'pj': {
          atkRpt: 'armes',
          atkName: 'armenom',
          atkRoll: 'pjatk',
          capaRpt: 'jetcapas',
          capaName: 'jetcapanom',
          capaRoll: 'pjcapa',
          traitRpt: 'traits',
          traitName: 'traitnom',
          traitRoll: 'pjtrait'
        },
        'pnj': {
          atkRpt: 'pnjatk',
          atkName: 'atknom',
          atkRoll: 'pnjatk',
          capaRpt: 'pnjcapas',
          capaName: 'capanom',
          capaRoll: 'pnjcapa'
        },
        'vaisseau': {
          atkRpt: 'armesv',
          atkName: 'armenom',
          atkRoll: 'vatk'
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
            chatMsg += `[${voie + 1}. ${voieNom}](!co-actions --voie ${voie + 1}${optDesc} --charId=${charId})\n\r`;
          }
        }
        if (chatMsg != '') {
          chatMsg = whisper(toGM, charName) + `&{template:co1} {{perso=${charAttr(charName, 'character_name')}}} {{subtags=${charAttr(charName, 'PROFIL')}}} {{name=Capacités}} {{desc=${chatMsg} }}`;
        }
        break;

        // !co-actions --voie # : liste des capacités voie #
      case '--voie':
        var voie = 'voie' + args[2] + '-';
        var rangs = [voie + '1', voie + '2', voie + '3', voie + '4', voie + '5']
        for (var rang = 0; rang < rangs.length; rang++) {
          // can have multiple ';' separated abilities
          var rangData = getAttrByName(charId, rangs[rang]).split(';');
          var chatRang = '';
          let items = 0;
          for (let rangNom of rangData) {
            if (chatRang != '' && ++items > 1) chatRang += ', ';
            rangNom = rangNom.trim();
            var rangLabel = rangNom;
            // can have <ability name> | <display label>
            if (rangNom.indexOf('|') != -1) {
              var rangExtras = rangNom.split('|');
              rangNom = rangExtras[0].trim();
              rangLabel = rangExtras[1].trim();
            }
            var abilityName = 'V' + args[2] + 'R' + (rang + 1).toString();
            if (rangNom != '') {
              var handoutObj = findHandout(rangNom);
              if (handoutObj) {
                chatRang += handoutLink(rangLabel, ((items > 1) ? 0 : rang + 1), handoutObj) + ' ';
              }
              if (optDesc != ' --desc') {
                var abilityObj = findAbility(charId, abilityName);
                if (abilityObj) {
                  chatRang += abilityButton(charId, rangLabel, abilityName, rang + 1, handoutObj, abilityObj);
                }
              }
            }
          }
          if (chatRang != '') chatMsg += chatRang + '\n\r';
        }
        if (chatMsg != '') {
          chatMsg = whisper(toGM, charName) + `&{template:co1} {{perso=${charName}}} {{subtags=Capacités}} {{name=${charAttr(charName, `voie${args[2]}nom`)}}} {{desc=${chatMsg} }}`;
        }
        break;

        // !co-actions --competences
      case '--competences':
        if (attrs.capaRpt === '') break;
        var rowIds = repeatRowIds(charId, attrs.capaRpt);
        if (rowIds.length > 0) {
          for (var competence = 0; competence < rowIds.length; competence++) {
            var compNom = getAttrByName(charId, repeatAttr(attrs.capaRpt, rowIds[competence], attrs.capaName));
            var compLabel = getAttrByName(charId, repeatAttr(attrs.capaRpt, rowIds[competence], attrs.capaSkill));;
            if (compNom != '') {
              chatMsg += `[${compNom}](~${charId}|${repeatAttr(attrs.capaRpt, rowIds[competence], attrs.capaRoll)})` + (compLabel && compLabel != null ? ` ${compLabel}` : '') + '\n\r';
            }
          }
          if (chatMsg != '') {
            chatMsg = whisper(toGM, charName) + `&{template:co1} {{perso=${charName}}} {{subtags=${charAttr(charName, 'PROFIL')}}} {{name=Compétences}} {{desc=${chatMsg} }}`;
          }
        }
        break;

        // !co-actions --attaques
      case '--attaques':
        if (attrs.atkRpt === '') break;
        var rowIds = repeatRowIds(charId, attrs.atkRpt);
        if (rowIds.length > 0) {
          for (var arme = 0; arme < rowIds.length; arme++) {
            var armeNom = '';
            armeNom = getAttrByName(charId, repeatAttr(attrs.atkRpt, rowIds[arme], attrs.atkName));
            var atkNom = '';
            if (fiche === 'pj' || fiche === 'vaisseau') {
              atkNom = getAttrByName(charId, repeatAttr(attrs.atkRpt, rowIds[arme], 'armejetn'));
            }
            var atkInfo = '';
            atkInfo += (atkNom !== '') ? ' ' + atkNom : '';
            var atkType = getAttrByName(charId, repeatAttr(attrs.atkRpt, rowIds[arme], 'armeatk'));
            if (fiche !== 'vaisseau') {
              var limitee = '';
              if (fiche !== 'pnj') limitee = getAttrByName(charId, repeatAttr(attrs.atkRpt, rowIds[arme], 'armelim'));
              if (limitee != '') atkInfo += ' ' + limitee;
              var portee = '';
              if (fiche !== 'pnj') portee = getAttrByName(charId, repeatAttr(attrs.atkRpt, rowIds[arme], 'armeportee'));
              if (portee != '') {
                if (atkType == '@{ATKTIR}') atkInfo += ' (D:';
                if (atkType == '@{ATKMAG}') atkInfo += ' (Mag:';
                if (atkType == '@{ATKMEN}') atkInfo += ' (Men:';
                if (atkType == '@{ATKPSYINFLU}' || atkType == '@{ATKPSYINTUI}') atkInfo += ' (Psy:';
                atkInfo += portee + ')';
              } else {
                if (fiche !== 'pnj') {
                  if (atkType == '@{ATKMAG}') {
                    atkInfo += ' (Mag)';
                  } else if (atkType == '@{ATKMEN}') {
                    atkInfo += ' (Men)';
                  } else if (atkType == '@{ATKPSYINFLU}' || atkType == '@{ATKPSYINTUI}') {
                    atkInfo += ' (Psy)';
                  } else {
                    atkInfo += ' (C)';
                  }
                }
              }
            }
            if (armeNom != '') {
              chatMsg += `[${armeNom}](~${charId}|${repeatAttr(attrs.atkRpt, rowIds[arme], attrs.atkRoll)}) ${atkInfo}\n\r`;
            }
          }
          if (chatMsg != '') {
            chatMsg = whisper(toGM, charName) + `&{template:co1} {{perso=${charName}}} {{subtags=Combat}} {{name=Attaques}} {{desc=${chatMsg} }}`;
          }
        }
        break;
      
      case '--atk':
        if (attrs.atkRpt === '' || args.length < 3) break;
        chatMsg = whisper(toGM, charName) + `%{${charName}|${repeatAttr(attrs.atkRpt, args[2], attrs.atkRoll)}}`;
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
   * Create, rename or delete profile and abilities handouts from JSON data
   * !co-import capacites.profileName [rename|delete]
   * @param {string} data 
   * @param {object} flags 
   */
  function importAbilities(data, flags) {
    const abilities = JSON.parse(data);
    let profil = abilities.rs[0].profil;
    let path = "";
    let profileHandout = "";
    for (const item of abilities.rs) {
      let fullAbility = `${profil}.${item.voie}.${item.rang}.${item.capacite}`;
      let action = "";
      if (flags.deleteFlg) {
        const handouts = findObjs({
          _type: "handout",
          name: fullAbility
        });
        for (const handout of handouts) {
          handout.remove();
          action = "[Deleted] ";
        }
      } else if (flags.renameFlg) {
        const handouts = findObjs({
          _type: "handout",
          name: fullAbility
        });
        if (handouts.length == 1) {
          handouts[0].set({
            name: item.capacite
          });
          action = "[Renamed] ";
        }
      } else {
        if (item.rang == "1") {
          path = `Voie ${item.voie_deladu}${item.voie}`;
          profileHandout += `<h3>${path}</h3>`;
          if (item.voie_notes !== "") profileHandout += `<p>${item.voie_notes}</p>`;
          profileHandout += "<ol>";
        }
        const handout = createObj('handout', {
          name: fullAbility,
          inplayerjournals: 'all',
          archived: false
        });
        profileHandout += `
                <li>
                <a href="http://journal.roll20.net/handout/${handout.id}">${item.capacite}</a>
                </li>
                `;
        let limitee = "";
        if (item.limitee == 1) limitee = " (L)";
        let sort = "";
        if (item.sort == 1) sort = "*";
        const notes = `
                <h3>${item.capacite}${limitee}${sort}</h3>
                <h5>${path}, rang ${item.rang}</h5>
                <br>
                <p>${item.description}</p>
                `;
        handout.set({
          notes: notes
        });
        handout.set({
          gmnotes: `<p>${fullAbility.split(".").join(" | ")}</p>`
        });
        if (item.rang == "5") {
          profileHandout += "</ol>";
          profileHandout += "<br>";
        }
      }
      log(action + fullAbility);
    }
    if (!flags.deleteFlg && !flags.renameFlg) {
      const handout = createObj('handout', {
        name: `Profil : ${profil}`,
        inplayerjournals: 'all',
        archived: false
      });
      handout.set({
        notes: profileHandout
      });
    }
  }

  /**
   * Create, rename and delete abilities handouts for a single path from JSON data
   * !co-import voie.pathName [rename|delete]
   * @param {string} data 
   * @param {object} flags 
   */
  function importPath(data, flags) {
    const path = JSON.parse(data);
    for (const item of path.rs) {
      let fullAbility = `${item.rang}.${item.nom}`;
      let action = "";
      if (flags.deleteFlg) {
        const handouts = findObjs({
          _type: "handout",
          name: fullAbility
        });
        for (const handout of handouts) {
          handout.remove();
          action = "[Deleted] ";
        }
      } else if (flags.renameFlg) {
        const handouts = findObjs({
          _type: "handout",
          name: fullAbility
        });
        if (handouts.length == 1) {
          handouts[0].set({
            name: item.nom
          });
          action = "[Renamed] ";
        }
      } else {
        const handout = createObj('handout', {
          name: fullAbility,
          inplayerjournals: 'all',
          archived: false
        });
        pathName = `Voie ${item.voie_deladu}${item.voie}`;
        let limitee = "";
        if (item.limitee == 1) limitee = " (L)";
        let sort = "";
        if (item.sort == 1) sort = "*";
        const notes = `
                  <h3>${item.nom}${limitee}${sort}</h3>
                  <h5>${pathName}, rang ${item.rang}</h5>
                  <br>
                  <p>${item.description}</p>
                  `;
        handout.set({
          notes: notes
        });
      }
    }
  }

  /**
   * Create a profile handout from JSON data
   * !co-import profil.profileName [rename|delete]
   * @param {string} data 
   */
  function importProfile(data) {
    const profile = JSON.parse(data);
    let notes = '';
    for (item of profile.rs) {
      if (item.rang === '1') {
        notes += `<h3>Voie ${item.voie_deladu}${item.nom}</h3>`;
        notes += '<ol>';
      }
      const handouts = findObjs({
        _type: "handout",
        name: item.capacite
      });
      notes += 
      `
        <li>
        <a href="http://journal.roll20.net/handout/${handouts[0].id}">${item.capacite}</a>
        </li>
      `;
      if (item.rang === '5') {
        notes += '</ol>';
        notes += '<br>';
      }
    }
    const handout = createObj('handout', {
      name: "Profil : " + item.profil,
      inplayerjournals: 'all',
      archived: false
    });
    handout.set({
      notes: notes
    });
  }

  /**
   * Create equipment handouts for a category from JSON data
   * !co-import equipment.categoryName
   * @param {string} data 
   */
  function importGear(data) {
    const equipments = JSON.parse(data);
    for (const equipment of equipments.rs) {
      let notes = '';
      notes += `<h3>${equipment.designation}</h3>`;
      notes += `<h5>${equipment.categorie}</h5>`;
      notes += '<ul>'
      const props = equipment.props.split('~');
      for (const prop of props) {
        notes += `<li>${prop}</li>`
      }
      notes += `<li>Prix : ${equipment.prix}</li>`;
      notes += '</ul>';
      notes += `<p>${equipment.notes}</p>`;
      const handout = createObj('handout', {
        name: equipment.designation,
        inplayerjournals: 'all',
        archived: false
      });
      handout.set({
        notes: notes
      });
    }
  }

  /**
   * Retrieve handout content
   * !co-import handoutName [delete|rename]
   * @param {array<string>} command 
   */
  function readHandout(command) {

    if (command.length < 2) {
      sendChat('COlib', '/w gm Missing handout name !');
      return;
    }
    let handoutName = command[1];
    const deleteFlg = ((command[2] || '').toLowerCase() === "delete");
    const renameFlg = ((command[2] || '').toLowerCase() === "rename");
    const flags = { 
      "deleteFlg": deleteFlg,
      "renameFlg": renameFlg
    };

    const handouts = findObjs({
      _type: "handout",
      name: handoutName
    });
    const handoutObj = handouts[0];

    handoutObj.get("notes", function (notes) {
      notes = notes.replace(/<p>/gi, "");
      notes = notes.replace(/<\/p>/gi, "");
      notes = notes.replace(/<br>/gi, "");
      if (handoutName.indexOf("capacites.") == 0) {
        importAbilities(notes, flags);
      }
      if (handoutName.indexOf("voie.") == 0) {
        importPath(notes, flags);
      }
      if (handoutName.indexOf("profil.") == 0) {
        importProfile(notes);
      }
      if (handoutName.indexOf("equipement.") == 0) {
        importGear(notes);
      }
    });

  }

  /**
   * Ping & move map to starting point
   */
  function pingStartToken() {
    const startToken = "GroupePJs";
    const tokens = findObjs({
      _name: startToken,
      _type: "graphic",
      _pageid: Campaign().get("playerpageid")
    });
    const playerStartToken = tokens[0];
    if (playerStartToken === undefined) {
      sendChat('COlib', `/w gm Missing '${startToken}' token`);
      return;
    }
    sendPing(playerStartToken.get("left"), playerStartToken.get("top"), playerStartToken.get("pageid"), "", true);
  }

  function setCharacterAttrs(characterObj, marker) {
    switch (marker.name) {
      case 'dead':
        break;
      default:
        break;
    }
  }

  function setVirtual(tokenObj, marker) {
    const prop = `status_${marker.name}`;
    const state = marker.op === "-" ? false : true;
    tokenObj.set(prop, state);
  }

  function setMarkers(tokenObj, characterObj, markerOps) {
    // standard markers
    const stdMarkers = 'red,blue,green,brown,purple,pink,yellow,dead'.split(',');
    // game's custom markers
    const tokenMarkers = JSON.parse(Campaign().get("token_markers"));
    // token's markers
    let currentMarkers = tokenObj.get("statusmarkers").split(',');
    // loop through list of markers
    markerOps.forEach(marker => {
      if (marker.op === '+') { // set
        let tokenMarker = tokenMarkers.find(tm => tm.name === marker.name);
        if (!tokenMarker) {
          tokenMarker = stdMarkers.find(std => std === marker.name);
        }
        if (tokenMarker) {
          if (currentMarkers.length === 1 && currentMarkers[0] === '') {
            currentMarkers[0] = marker.name;
          }
          else if (currentMarkers.indexOf(marker.name) === -1) {
            currentMarkers.push(marker.name);
          }
          if (stdMarkers.indexOf(marker.name) !== -1) {
            setVirtual(tokenObj, marker);
          }
        }
        setCharacterAttrs(characterObj, marker)
      }
      if (marker.op === '-') { // unset
        if (marker.name === '*') {
          currentMarkers.forEach(item => {
            if (stdMarkers.indexOf(item) !== -1) {
              setVirtual(tokenObj, { op: '-', name: item });
            }
            setCharacterAttrs(characterObj, { op: '-', name: item })
          });
          currentMarkers = [];
        }
        else {
          currentMarkers = tokenObj.get("statusmarkers").split(',');
          currentMarkers = currentMarkers.filter(name => name !== marker.name);
          if (stdMarkers.indexOf(marker.name) !== -1) {
            setVirtual(tokenObj, marker);
          }
          setCharacterAttrs(characterObj, marker)
        }
      }
    });
    tokenObj.set("statusmarkers", currentMarkers.join(','));
  }

  function tokenMarkers(tokenObj, characterObj, command) {
    let markerOps = [];
    for (const cmd of command) {
      if (cmd.toLowerCase().startsWith('+set:') || cmd.toLowerCase().startsWith('-set:')) {
        const args = cmd.split(':');
        const markers = args[1].split(',');
        markers.forEach(marker => {
          markerOps.push({ op: cmd.slice(0,1), name: marker });
        });
      }
      if (cmd.toLowerCase().startsWith('--set:')) {
        const args = cmd.split(':');
        const markers = args[1].split(',');
        markers.forEach(marker => {
          markerOps.push({ op: marker.slice(0, 1), name: marker.slice(1) });
        });
      }
    }
    setMarkers(tokenObj, characterObj, markerOps);
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
   * @param {array<string>} command 
   */
  function configCOlib(args) {
    if (command.length == 1) {
      configDisplay();
      return;
    }
    switch (command[1]) {
      case '--u':
        state.COlib.universe = command[2].toUpperCase();
        configDisplay();
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

  function singleToken(msg, tokens) {
    const count = tokens.length;
    if (count != 1) {
      sendChat('COlib', '\n\rPlease select a token first !');
      sendLog(`Cannot execute '${msg.content}' : ${count} token(s) selected`, true);
      return null;
    }
    return tokens[0];
  }

  /**
   * Process API chat commands
   * @param {string} msg 
   */
  function apiCommand(msg) {
    msg.content = msg.content.replace(/\s+/g, ' '); //remove duplicate whites
    const command = msg.content.split(' ');
    const tokens = getTokens(msg);
    let character = null;

    switch (command[0]) {
      case '!co-config':
        configCOlib(command);
        break;
      case '!co-actions':
        // check for --charid=@{character name|character_id} in command
        for (cmd of command) {
          if (cmd.toLowerCase().startsWith('--charid=')) {
            charId = cmd.split('=')[1] || '';
            if (charId !== '') {
              if (charId.startsWith("'") || charId.startsWith('"')) {
                charId = eval(charId);
              }
              character = getCharacter(charId);
            }
          }
        }
        // check if token selected
        if (!character) {
          const token = singleToken(msg, tokens);
          if (!token) {
            break;
          }
          character = getCharacterFromToken(token);
        }
        // display character's action
        if (character) {
          displayActions(character.id, command);
        } else {
          sendChat('COlib', '\n\rPlease select a PC or NPC token first !');
          sendLog(`Cannot execute '${msg.content}' : token not associated with a journal item`, true);
        }
        break;
      case '!co-import':
        readHandout(command);
        break;
      case '!co-ping':
        pingStartToken();
        break;
      case '!co-token':
        const token = singleToken(msg, tokens);
        if (!token) {
          break;
        }
        character = getCharacterFromToken(token);
        tokenMarkers(token, character, command);
        break;
      default:
        break;
    }
    return;
  }

  return {
    apiCommand: apiCommand,
    pingStartToken: pingStartToken,
  }

}();

/**
 * Wire-up initialization event
 */
on("ready", function () {

  log(`COlib version ${COlib_version} loaded`);

  if (!state.COlib) {
    state.COlib = {
      universe: 'COC',
      whisper: false,
      logging: false
    }
  }

  /**
  * Wire-up event for API chat message
  */
  on("chat:message", function (msg) {

    "use strict";

    if (msg.type === 'api') {
      COlib.apiCommand(msg);
    }

  });

  /**
  * Wire-up event for player page change
   */
  on("change:campaign:playerpageid", function () {
    setTimeout(function () {
      COlib.pingStartToken();
    }, 1500);
  });

});
