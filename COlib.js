/**
 * COlib : Chronique Oubliées library
 */

var COlib_version = 2.21;

var COlib =
  COlib ||
  (function () {
    /**
     * Whisper a message to a player
     * @param {string} origin
     * @param {string} msg
     */
    function sendPlayer(origin, msg) {
      let dest = origin;
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
     * Return all the row ids for a given section
     * @param {string} charId
     * @param {string} section
     */
    function repeatRowIds(charId, section) {
      let rowIds = [];
      const attribs = findObjs({
        _type: 'attribute',
        _characterid: charId,
      });
      for (const attrib of attribs) {
        const attrName = attrib.get('name');
        if (attrName.startsWith(`repeating_${section}_`)) {
          var rowId = attrName.split('_');
          if (rowIds.indexOf(rowId[2]) === -1) rowIds.push(rowId[2]);
        }
      }
      return rowIds;
    }

    /**
     * Return the ordered list of ids for a section
     * @param {string} sectionName : section name
     * @param {function} callback : callback function to process the ids
     */
    function getSectionIDsOrdered(sectionName, callback) {
      'use strict';
      getAttrs([`_reporder_${sectionName}`], function (v) {
        getSectionIDs(sectionName, function (idArray) {
          let reporderArray = v[`_reporder_${sectionName}`]
              ? v[`_reporder_${sectionName}`].toLowerCase().split(',')
              : [],
            ids = [
              ...new Set(
                reporderArray.filter((x) => idArray.includes(x)).concat(idArray)
              ),
            ];
          callback(ids);
        });
      });
    }

    /**
     * Return an handout object
     * @param {string} name : handout name
     */
    function findHandout(name) {
      const handoutObj = findObjs(
        {
          _type: 'handout',
          _name: name,
        },
        {
          caseInsensitive: true,
        }
      )[0];
      return handoutObj;
    }

    /**
     * Return an handout hyperlink
     * @param {string} name
     * @param {string} sequence
     * @param {object} handoutObj
     */
    function handoutLink(name, sequence, handoutObj) {
      let link = '';
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
      const abilityObj = findObjs(
        {
          _type: 'ability',
          _characterid: charId,
          name: abilityName,
        },
        {
          caseInsensitive: true,
        }
      )[0];
      return abilityObj;
    }

    /**
     * Return the fully qualified name of a roll for an ability identifier (VxRy)
     * @param {string} charId
     * @param {string} abilityId
     */
    function findAbilityRoll(charId, abilityId) {
      const rowIds = repeatRowIds(charId, 'jetcapas');
      let abilityRoll = '';
      for (const rowId of rowIds) {
        const roll = findObjs({
          _type: 'attribute',
          _characterid: charId,
          name: `repeating_jetcapas_${rowId}_jetcapavr`,
        });
        if (roll.length === 1) {
          if (roll[0].get('current') === abilityId.toLowerCase()) {
            abilityRoll = `repeating_jetcapas_${rowId}_pjcapa`;
            break;
          }
        }
      }
      return abilityRoll;
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
    function abilityButton(
      charId,
      name,
      ability,
      sequence,
      handoutObj,
      abilityObj
    ) {
      let button = '';
      let buttonRoll = '';
      if (!handoutObj) handoutObj = findHandout(name);
      if (!abilityObj) abilityObj = findAbility(charId, ability);
      if (abilityObj) {
        if (abilityObj.get('action') != '') {
          buttonRoll = ability;
        }
      } else {
        const abilityRoll = findAbilityRoll(charId, ability);
        if (abilityRoll) {
          buttonRoll = abilityRoll;
        }
      }
      if (buttonRoll !== '') {
        button += '[';
        if (handoutObj) {
          button += 'Jet';
        } else {
          if (sequence > 0) button += sequence.toString() + '. ';
          button += name;
        }
        button += `](~${charId}|${buttonRoll})`;
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
        msg.selected.forEach((token) => {
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
      if (id) {
        return getObj('character', id);
      } else {
        return null;
      }
    }

    /**
     * Return character object from token
     * @param {object} token Token object
     * @returns {object}
     */
    function getCharacterFromToken(token) {
      if (token) {
        return getObj('character', token.get('represents'));
      } else {
        return null;
      }
    }

    /**
     * Return character id from --charid= command line arguments
     * @param {array<string>} args Chat command arguments
     */
    function getCharacterId(args) {
      let charId = null;
      args.forEach((arg) => {
        if (arg.toLowerCase().startsWith('--charid=')) {
          charId = arg.split('=')[1] || '';
          if (charId !== '') {
            if (charId.startsWith("'") || charId.startsWith('"')) {
              charId = eval(charId);
            }
          }
        }
      });
      return charId;
    }

    /**
     * Return selected tokens as an array of character objects
     * @param {object} msg Chat message object
     * @returns {array<object>}
     */
    function getCharactersFromTokens(msg) {
      let characters = [];
      const tokens = getTokens(msg);
      tokens.forEach((token) => {
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
      let w = toGM;
      if (w == '' && state.COlib.whisper) {
        w = `/w "${charName}" `;
      }
      return w;
    }

    /**
     * Output a list of actions to the chat
     * @param {string} charId Character Id
     * @param {string} args Chat command arguments
     */
    function displayActions(charId, args) {
      const charName = getAttrByName(charId, 'character_name');
      let chatMsg = '';
      let optDesc = ''; // descriptions only
      const fiche = getAttrByName(charId, 'type_personnage');
      const toGM = getAttrByName(charId, fiche === 'pnj' ? 'pnj_togm' : 'togm');
      for (const arg of args) {
        if (arg == '--desc') optDesc = ' --desc';
      }

      const attrNames = {
        COF: {
          pj: {
            atkRpt: 'armes',
            atkName: 'armenom',
            atkRoll: 'jet',
            capaRpt: 'jetcapas',
            capaName: 'jetcapanom',
            capaRoll: 'jet',
          },
          pnj: {
            atkRpt: 'pnjatk',
            atkRoll: 'jet',
            capaRpt: 'pnjcapas',
            capaRoll: 'jet',
          },
        },
        COC: {
          pj: {
            atkRpt: 'armes',
            atkName: 'armenom',
            atkRoll: 'pjatk',
            capaRpt: 'jetcapas',
            capaName: 'jetcapanom',
            capaSkill: 'jetcapatitre',
            capaRoll: 'pjcapa',
            traitRpt: 'traits',
            traitName: 'traitnom',
            traitRoll: 'pjtrait',
          },
          pnj: {
            atkRpt: 'pnjatk',
            atkName: 'atknom',
            atkRoll: 'pnjatk',
            capaRpt: 'pnjcapas',
            capaName: 'capanom',
            capaRoll: 'pnjcapa',
          },
          vehicule: {
            capaRpt: 'jetv',
            capaName: 'jetvnom',
            capaRoll: 'vehicule',
          },
        },
        CG: {
          pj: {
            atkRpt: 'armes',
            atkName: 'armenom',
            atkRoll: 'pjatk',
            capaRpt: 'jetcapas',
            capaName: 'jetcapanom',
            capaRoll: 'pjcapa',
            traitRpt: 'traits',
            traitName: 'traitnom',
            traitRoll: 'pjtrait',
          },
          pnj: {
            atkRpt: 'pnjatk',
            atkName: 'atknom',
            atkRoll: 'pnjatk',
            capaRpt: 'pnjcapas',
            capaName: 'capanom',
            capaRoll: 'pnjcapa',
          },
          vaisseau: {
            atkRpt: 'armesv',
            atkName: 'armenom',
            atkRoll: 'vatk',
          },
        },
      };

      const attrs = attrNames[state.COlib.universe][fiche];

      let rowIds = [];
      switch (args[0]) {
        // !colib actions --voies : liste des voies
        case '--voies':
          const voies = [
            'voie1nom',
            'voie2nom',
            'voie3nom',
            'voie4nom',
            'voie5nom',
            'voie6nom',
            'voie7nom',
            'voie8nom',
            'voie9nom',
          ];
          voies.forEach((voieAttr, voie) => {
            const voieNom = getAttrByName(charId, voieAttr);
            if (voieNom != '') {
              chatMsg += `[${voie + 1}. ${voieNom}](!co-actions --voie ${
                voie + 1
              }${optDesc} --charId=${charId})\n\r`;
            }
          });
          if (chatMsg != '') {
            chatMsg =
              whisper(toGM, charName) +
              `&{template:co1} {{perso=${charAttr(
                charName,
                'character_name'
              )}}} {{subtags=${charAttr(
                charName,
                'PROFIL'
              )}}} {{name=Capacités}} {{desc=${chatMsg} }}`;
          }
          break;

        // !colib actions --voie # : liste des capacités voie #
        case '--voie':
          const voie = 'voie' + args[1] + '-';
          const rangs = [
            voie + '1',
            voie + '2',
            voie + '3',
            voie + '4',
            voie + '5',
          ];
          rangs.forEach((rangAttr, rang) => {
            // check if character has ability
            const hasAbility = getAttrByName(
              charId,
              rangAttr.replace('voie', 'v').replace('-', 'r')
            );
            if (hasAbility !== '1') return;
            // parse ability title from description, if any
            let rangInfo = getAttrByName(charId, rangAttr);
            if (rangInfo.indexOf('\n') !== -1)
              rangInfo = rangInfo.split('\n')[0];
            // can have multiple ';' separated abilities
            const rangData = rangInfo.split(';');
            let chatRang = '';
            rangData.forEach((rangNom, item) => {
              if (chatRang != '' && item > 0) chatRang += ', ';
              rangNom = rangNom.trim();
              let rangLabel = rangNom;
              // can have <ability name> | <display label>
              if (rangNom.indexOf('|') != -1) {
                const rangExtras = rangNom.split('|');
                rangNom = rangExtras[0].trim();
                rangLabel = rangExtras[1].trim();
              }
              const abilityName = 'V' + args[1] + 'R' + (rang + 1).toString();
              if (rangNom != '') {
                const handoutObj = findHandout(rangNom);
                if (handoutObj) {
                  chatRang +=
                    handoutLink(
                      rangLabel,
                      item > 0 ? 0 : rang + 1,
                      handoutObj
                    ) + ' ';
                }
                if (optDesc != ' --desc') {
                  const abilityObj = findAbility(charId, abilityName);
                  if (abilityObj) {
                    chatRang += abilityButton(
                      charId,
                      rangLabel,
                      abilityName,
                      rang + 1,
                      handoutObj,
                      abilityObj
                    );
                  } else {
                    chatRang += abilityButton(
                      charId,
                      rangLabel,
                      abilityName,
                      rang + 1,
                      handoutObj,
                      null
                    );
                  }
                }
              }
            });
            if (chatRang != '') chatMsg += chatRang + '\n\r';
          });
          if (chatMsg != '') {
            chatMsg =
              whisper(toGM, charName) +
              `&{template:co1} {{perso=${charName}}} {{subtags=Capacités}} {{name=${charAttr(
                charName,
                `voie${args[1]}nom`
              )}}} {{desc=${chatMsg} }}`;
          }
          break;

        // !colib actions --competences
        case '--competences':
          if (attrs.capaRpt === '') break;
          rowIds = repeatRowIds(charId, attrs.capaRpt);
          if (rowIds.length > 0) {
            rowIds.forEach((rowId) => {
              const compNom = getAttrByName(
                charId,
                repeatAttr(attrs.capaRpt, rowId, attrs.capaName)
              );
              const compLabel = getAttrByName(
                charId,
                repeatAttr(attrs.capaRpt, rowId, attrs.capaSkill)
              );
              if (compNom != '') {
                chatMsg +=
                  `[${compNom}](~${charId}|${repeatAttr(
                    attrs.capaRpt,
                    rowId,
                    attrs.capaRoll
                  )})` +
                  (compLabel && compLabel != null ? ` ${compLabel}` : '') +
                  '\n\r';
              }
            });
            if (chatMsg != '') {
              chatMsg =
                whisper(toGM, charName) +
                `&{template:co1} {{perso=${charName}}} {{subtags=${charAttr(
                  charName,
                  'PROFIL'
                )}}} {{name=Compétences}} {{desc=${chatMsg} }}`;
            }
          }
          break;

        // !colib actions --attaques
        case '--attaques':
          if (attrs.atkRpt === '') break;
          rowIds = repeatRowIds(charId, attrs.atkRpt);
          if (rowIds.length > 0) {
            for (let arme = 0; arme < rowIds.length; arme++) {
              let armeNom = '';
              armeNom = getAttrByName(
                charId,
                repeatAttr(attrs.atkRpt, rowIds[arme], attrs.atkName)
              );
              let atkNom = '';
              if (fiche === 'pj' || fiche === 'vaisseau') {
                atkNom = getAttrByName(
                  charId,
                  repeatAttr(attrs.atkRpt, rowIds[arme], 'armejetn')
                );
              }
              let atkInfo = '';
              atkInfo += atkNom !== '' ? ' ' + atkNom : '';
              const atkType = getAttrByName(
                charId,
                repeatAttr(attrs.atkRpt, rowIds[arme], 'armeatk')
              );
              if (fiche !== 'vaisseau') {
                let limitee = '';
                if (fiche !== 'pnj')
                  limitee = getAttrByName(
                    charId,
                    repeatAttr(attrs.atkRpt, rowIds[arme], 'armelim')
                  );
                if (limitee != '') atkInfo += ' ' + limitee;
                let portee = '';
                if (fiche !== 'pnj')
                  portee = getAttrByName(
                    charId,
                    repeatAttr(attrs.atkRpt, rowIds[arme], 'armeportee')
                  );
                if (portee != '') {
                  if (atkType == '@{ATKTIR}') atkInfo += ' (D:';
                  if (atkType == '@{ATKMAG}') atkInfo += ' (Mag:';
                  if (atkType == '@{ATKMEN}') atkInfo += ' (Men:';
                  if (
                    atkType == '@{ATKPSYINFLU}' ||
                    atkType == '@{ATKPSYINTUI}'
                  )
                    atkInfo += ' (Psy:';
                  atkInfo += portee + ')';
                } else {
                  if (fiche !== 'pnj') {
                    if (atkType == '@{ATKMAG}') {
                      atkInfo += ' (Mag)';
                    } else if (atkType == '@{ATKMEN}') {
                      atkInfo += ' (Men)';
                    } else if (
                      atkType == '@{ATKPSYINFLU}' ||
                      atkType == '@{ATKPSYINTUI}'
                    ) {
                      atkInfo += ' (Psy)';
                    } else {
                      atkInfo += ' (C)';
                    }
                  }
                }
              }
              if (armeNom != '') {
                chatMsg += `[${armeNom}](~${charId}|${repeatAttr(
                  attrs.atkRpt,
                  rowIds[arme],
                  attrs.atkRoll
                )}) ${atkInfo}\n\r`;
              }
            }
            if (chatMsg != '') {
              chatMsg =
                whisper(toGM, charName) +
                `&{template:co1} {{perso=${charName}}} {{subtags=Combat}} {{name=Attaques}} {{desc=${chatMsg} }}`;
            }
          }
          break;

        case '--atk':
          if (attrs.atkRpt === '' || args.length < 2) break;
          chatMsg =
            whisper(toGM, charName) +
            `%{${charName}|${repeatAttr(
              attrs.atkRpt,
              args[1],
              attrs.atkRoll
            )}}`;
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
     * Create equipment handouts for a category from JSON data
     * !colib import equipment.categoryName
     * @param {string} data
     */
    function importGear(data) {
      const equipments = JSON.parse(data);
      for (const equipment of equipments.rs) {
        let notes = '';
        notes += `<h3>${equipment.designation}</h3>`;
        notes += `<h5>${equipment.categorie}</h5>`;
        notes += '<ul>';
        const props = equipment.props.split('~');
        for (const prop of props) {
          notes += `<li>${prop}</li>`;
        }
        notes += `<li>Prix : ${equipment.prix}</li>`;
        notes += '</ul>';
        notes += `<p>${equipment.notes}</p>`;
        const handout = createObj('handout', {
          name: equipment.designation,
          inplayerjournals: 'all',
          archived: false,
        });
        handout.set({
          notes: notes,
        });
      }
    }

    /**
     * Find an handout object or create it
     * @param {object} props Properties of the object to find or create
     * @param {string} unique Unique identifier for the handout
     * @returns Handout object
     */
    function findOrNewHandout(props, unique) {
      unique = unique || '';
      const exist = findObjs({
        _type: 'handout',
        name: props.name,
      });
      let handoutObj;
      if (exist.length === 0) {
        handoutObj = createObj('handout', props);
      } else {
        if (exist.length === 1 || unique === '') {
          handoutObj = exist[0];
        } else {
          exist.forEach((handout) => {
            handout.get('gmnotes', function (gmnotes) {
              if (gmnotes === unique) {
                handoutObj = handout;
              }
            });
          });
        }
      }
      return handoutObj;
    }

    /**
     * Find an attribute object or create it
     * @param {object} props Properties of the object to find or create
     */
    function findOrNewAttribute(props) {
      const exist = findObjs({
        _type: 'attribute',
        ...props,
      });
      let attributeObj;
      if (exist.length === 0) {
        attributeObj = createObj('attribute', props);
      } else {
        attributeObj = exist[0];
      }
      return attributeObj;
    }

    /**
     * Import profile, paths & abilities from an handout with JSON data
     * @param {object} profileHandout Handout object
     * @param {string} data JSON data to parse
     * @param {object} character Character object to set abilities
     */
    function importProfileInfo(profileHandout, data, character) {
      // let name = profileHandout.get('name').split('.')[1].toLowerCase();
      // const profileName = name.slice(0, 1).toUpperCase() + name.slice(1);
      let profileNotes = '';
      const characterData = [];
      data = data.replace(/<p>/gi, '');
      data = data.replace(/<\/p>/gi, '');
      data = data.replace(/<br>/gi, '');
      const profileData = JSON.parse(data);
      const profileName = profileData.profile;
      profileData.paths.forEach((path, ix) => {
        profileNotes += `<h3>${path.full}</h3>`;
        profileNotes += '<ol>';
        if (character)
          characterData.push({ name: `voie${ix + 1}nom`, value: path.name });
        path.abilities.forEach((ability, rank) => {
          let gmnotes = [path.name, `${rank + 1}`, ability.name].join('|');
          if (state.COlib.universe.toUpperCase() !== 'COC') {
            gmnotes = `${profileName}|${gmnotes}`;
          }
          const abilityHandout = findOrNewHandout(
            {
              name: ability.name,
              inplayerjournals: 'all',
              archived: false,
            },
            gmnotes
          );
          abilityNotes = `
          <h3>${ability.name}${ability.limitedUse}${ability.spell}</h3>
          <h5>${path.full}, rang ${rank + 1}</h5>
          <br>
          <p>${ability.description}</p>
          `;
          abilityHandout.set({
            notes: abilityNotes,
          });
          abilityHandout.set({
            gmnotes: gmnotes,
          });
          sendLog(gmnotes);
          sendChat('COlib', `/w gm ${gmnotes}`);
          if (character)
            characterData.push({
              name: `voie${ix + 1}-${rank + 1}`,
              value: ability.name + '\n' + ability.description,
            });
          profileNotes += `
          <li>
          <a href="http://journal.roll20.net/handout/${abilityHandout.id}">${ability.name}</a>
          </li>
          `;
        });
        profileNotes += '</ol>';
      });
      profileHandout.set({
        name: `Profil : ${profileName}`,
        inplayerjournals: 'all',
        archived: false,
        notes: profileNotes,
      });
      sendChat('COlib', '/w gm Import terminé');
      // set character attributes
      characterData.forEach((attr) => {
        const attribute = findOrNewAttribute({
          _characterid: character.id,
          name: attr.name,
        });
        attribute.set({ current: attr.value });
        sendLog(attribute);
        sendChat(
          'COlib',
          `/w gm ${attr.name}='${attr.value.replace(/\n/g, ' ')}'`
        );
      });
      if (characterData.length !== 0)
        sendChat('COlib', '/w gm Fiche de personnage complétée');
    }

    /**
     * Retrieve handout content
     * !colib import handoutName
     * @param {array<string>} args Chat command arguments
     */
    function readHandout(args) {
      if (args.length === 0) {
        sendChat('COlib', '/w gm Missing handout name !');
        return;
      }
      let handoutName = args[0];
      if (handoutName.toLowerCase().indexOf('import.') == -1) {
        sendChat('COlib', "/w gm Handout name must be begin with 'import.' !");
        return;
      }
      const character = getCharacter(getCharacterId(args));

      const handouts = findObjs({
        _type: 'handout',
        name: handoutName,
      });
      if (handouts.length === 0) {
        sendChat('COlib', '/w gm No handout with this name was found !');
        return;
      }

      const handoutObj = handouts[0];
      handoutObj.get('gmnotes', function (data) {
        if (data === 'null') {
          sendChat(
            'COlib',
            '/w gm JSON data must be pasted into the GM notes field !'
          );
          return;
        }
        importProfileInfo(handoutObj, data, character);
      });
    }

    /**
     * Ping & move map to starting point
     * !colib ping [...]
     */
    function pingStartToken() {
      const startToken = 'GroupePJs';
      const tokens = findObjs({
        _name: startToken,
        _type: 'graphic',
        _pageid: Campaign().get('playerpageid'),
      });
      const playerStartToken = tokens[0];
      if (playerStartToken === undefined) {
        sendChat('COlib', `/w gm Missing '${startToken}' token`);
        return;
      }
      sendPing(
        playerStartToken.get('left'),
        playerStartToken.get('top'),
        playerStartToken.get('pageid'),
        '',
        true
      );
    }

    /**
     * Update character attributes from token marker change
     * @param {object} characterObj Roll20 character object
     * @param {object} marker Token marker object
     */
    function setCharacterAttrs(characterObj, marker) {
      switch (marker.name) {
        case 'dead':
          break;
        default:
          break;
      }
    }

    /**
     * Set legacy virtual properties for standard markers
     * @param {object} tokenObj Roll20 token object
     * @param {object} marker Token marker object
     */
    function setVirtual(tokenObj, marker) {
      const prop = `status_${marker.name}`;
      const state =
        marker.op === '-' ? false : marker.badge !== 0 ? marker.badge : true;
      tokenObj.set(prop, state);
    }

    /**
     * Apply token markers operation (add / remove)
     * @param {object} tokenObj Roll20 token object
     * @param {object} characterObj Roll20 character object
     * @param {array<object>} markerOps List of marker operations objects
     */
    function setMarkers(tokenObj, characterObj, markerOps) {
      // standard markers
      const stdMarkers = 'red,blue,green,brown,purple,pink,yellow,dead'.split(
        ','
      );
      // game's custom markers
      const tokenMarkers = JSON.parse(Campaign().get('token_markers'));
      // token's markers
      let currentMarkers = tokenObj.get('statusmarkers').split(',');
      // loop through list of markers
      markerOps.forEach((marker) => {
        const isStdMarker = stdMarkers.indexOf(marker.name) !== -1;
        if (marker.op === '+') {
          // set
          let statusmarker = '';
          let tokenMarker = tokenMarkers.find((tm) => tm.name === marker.name);
          if (tokenMarker) {
            statusmarker = tokenMarker.tag;
          } else {
            if (isStdMarker) {
              statusmarker = marker.name;
              setVirtual(tokenObj, marker, true);
            }
          }
          statusmarker += marker.badge !== 0 ? `@${marker.badge}` : '';
          if (currentMarkers.length === 1 && currentMarkers[0] === '') {
            currentMarkers[0] = statusmarker;
          } else if (currentMarkers.indexOf(statusmarker) === -1) {
            currentMarkers.push(statusmarker);
          }
        }
        if (marker.op === '-') {
          // unset
          if (marker.name === '*') {
            currentMarkers.forEach((marker) => {
              if (isStdMarker) {
                setVirtual(tokenObj, marker, false);
              }
            });
            currentMarkers = [];
          } else {
            currentMarkers = tokenObj.get('statusmarkers').split(',');
            currentMarkers = currentMarkers.filter((tag) =>
              tag.startsWith(marker.tag)
            );
            if (isStdMarker) {
              setVirtual(tokenObj, marker, false);
            }
          }
        }
      });
      tokenObj.set({ statusmarkers: currentMarkers.join(',') });

      if (characterObj) {
        markerOps.forEach((marker) => {
          if (stdMarkers.indexOf(marker.name) === -1) {
            let find = {
              _type: 'attribute',
              _characterid: characterObj._id,
              name: '',
            };
            let value = '';
            switch (marker.name) {
              case 'affaibli':
                find.name = 'ETATDE';
                value = marker.op === '+' ? '12' : '20';
                break;
              case '':
                break;
            }
            // find the attribute
            if (find.name) {
              const attrObj = findObjs(find)[0] || null;
              if (attrObj) {
                // set its value
                attrObj.set({ current: value });
              }
            }
          }
        });
      }
    }

    /**
     * Process token command
     * !colib token +set:xxxx -set:xxxx
     *   sets the marker(s) specified in +set:
     *   unsets the marker(s) specified in -set:
     *   xxxx can be on or more status marker name(s), comma-delimited
     *   each marker can be suffixed with =n (where 1 < n <9) to add a badge to the marker
     * !colib token --set:+xxx,+yyyy,-zzzz
     *   sets the markers prefixed with +
     *   unsets the markers prefixed with -
     *   same syntax as above for badges
     * @param {object} tokenObj Roll20 token object
     * @param {object} characterObj Roll20 character object
     * @param {array<string>} args Chat command arguments
     */
    function tokenMarkers(tokenObj, characterObj, args) {
      let markerOps = [];
      for (const arg of args) {
        if (
          arg.toLowerCase().startsWith('+set:') ||
          arg.toLowerCase().startsWith('-set:')
        ) {
          const ops = arg.split(':');
          const markers = ops[1].split(',');
          markers.forEach((marker) => {
            const badge = parseInt(marker.split('=')[1]) || 0;
            marker = marker.split('=')[0];
            markerOps.push({ op: arg.slice(0, 1), name: marker, badge: badge });
          });
        }
        if (arg.toLowerCase().startsWith('--set:')) {
          const ops = arg.split(':');
          const markers = ops[1].split(',');
          markers.forEach((marker) => {
            markerOps.push({ op: marker.slice(0, 1), name: marker.slice(1) });
          });
        }
      }
      setMarkers(tokenObj, characterObj, markerOps);
    }

    /**
     * Process stats roll command
     * !colib stats value1 value2 value3
     *   Determine the six stats values from 2d6 rolls
     *   Each 2d6 roll value is added to 6 to yield one stat value
     *   and subtracted from 19 to yield another stat value
     * exemple of use :
     *   !colib stats [[2d6]] [[2d6]] [[2d6]]
     * @param {array<string>} args Chat command arguments
     */
    function statRolls(args) {
      let rollValues = [];
      for (const argv of args) {
        if (argv > 1 && argv < 13) rollValues.push(argv);
      }
      while (rollValues.length < 3) {
        rollValues.push(randomInteger(6) + randomInteger(6));
      }

      let statValues = [];
      for (const roll of rollValues) {
        statValues.push(roll + 6);
        statValues.push(19 - roll);
      }

      let msge =
        '&{template:co1} {{subtags=Tirage}} {{name=Caractéristiques}} {{desc=';
      for (const stat of statValues) {
        msge += `[[${stat}]] `;
      }
      msge += '}}';
      sendChat('COlib', msge);
    }

    /**
     * Display script configuration
     */
    function configDisplay() {
      sendChat('COlib', `/w gm Univers (--universe) : ${state.COlib.universe}`);
      sendChat(
        'COlib',
        `/w gm Menus murmurés (--whisper) : ${state.COlib.whisper}`
      );
      sendChat('COlib', `/w gm Logs (--log) : ${state.COlib.logging}`);
    }

    /**
     * Process configuration command
     * !colib config [...]
     * @param {array<string>} args Chat command arguments
     */
    function configCOlib(args) {
      if (args.length === 0) {
        configDisplay();
        return;
      }
      switch (args[0]) {
        case '--universe':
          state.COlib.universe = args[1].toUpperCase();
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

    /**
     * Check only one token is selected
     * @param {object} msg Roll20 chat message object
     * @param {array<object>} tokens List of selected Roll20 token objects
     * @returns Selected Roll20 token object or null if 0 or more than 1 token selected
     */
    function singleToken(msg, tokens) {
      const count = tokens.length;
      if (count != 1) {
        sendChat('COlib', '\n\rPlease select a token first !');
        sendLog(
          `Cannot execute '${msg.content}' : ${count} token(s) selected`,
          true
        );
        return null;
      }
      return tokens[0];
    }

    /**
     * Process API chat commands
     * @param {object} msg Roll20 chat message object
     *
     * Chat command can be either :
     * !co-<action> <...args...>
     * or :
     * !colib action <...args...>
     */
    function apiCommand(msg) {
      msg.content = msg.content.replace(/\s+/g, ' '); //remove duplicate whites
      const [command, ...args] = msg.content.split(' ');
      const tokens = getTokens(msg);
      let character = null;
      let token = null;

      let action = '';
      if (command === '!colib') {
        action = args.shift();
      } else {
        action = command.replace('!co-', '');
      }

      switch (action) {
        case 'debug':
          log([command, ...args].join(' '));
          log(singleToken(msg, tokens));
          break;
        case 'config':
          configCOlib(args);
          break;
        case 'actions':
          character = getCharacter(getCharacterId(args));
          // check if token selected
          if (!character) {
            token = singleToken(msg, tokens);
            if (!token) {
              break;
            }
            character = getCharacterFromToken(token);
          }
          // display character's action
          if (character) {
            displayActions(character.id, args);
          } else {
            sendChat('COlib', '\n\rPlease select a PC or NPC token first !');
            sendLog(
              `Cannot execute '${msg.content}' : token not associated with a journal item`,
              true
            );
          }
          break;
        case 'import':
          readHandout(args);
          break;
        case 'ping':
          pingStartToken();
          break;
        case 'token':
          token = singleToken(msg, tokens);
          if (!token) {
            break;
          }
          character = getCharacterFromToken(token);
          tokenMarkers(token, character, args);
          break;
        case 'stats':
          statRolls(args);
          break;
        default:
          break;
      }
      return;
    }

    return {
      apiCommand: apiCommand,
      pingStartToken: pingStartToken,
    };
  })();

/**
 * Wire-up initialization event
 */
on('ready', function () {
  log(`COlib version ${COlib_version} loaded`);

  if (!state.COlib) {
    state.COlib = {
      universe: 'COC',
      whisper: false,
      logging: false,
    };
  }

  /**
   * Wire-up event for API chat message
   */
  on('chat:message', function (msg) {
    'use strict';

    if (msg.type === 'api') {
      COlib.apiCommand(msg);
    }
  });

  /**
   * Wire-up event for player page change
   */
  on('change:campaign:playerpageid', function () {
    setTimeout(function () {
      COlib.pingStartToken();
    }, 1500);
  });
});
