# COlib

Companion API script for COF/COC/CG Roll20 character sheets

## 2021-05-12 - Version 2.4

Added logic to update mecha crew abilities and related ranks values

## 2021-05-02 - Version 2.3

Added logic to update starship crew abilities and related ranks values

Whenever a starship sheet is opened, the worker script sets the POSTES*EQ atribute to *"update"\_

COlib sets an event handler to track changes to this attribute. Whenever it has the _"update"_ value :

- All starship battle stations (PIL, MOT, SEN, ORD, and attack entries for CAN) are scanned for a character name
- If the corresponding character sheet is found, the DEX (PIL, CAN) or INT (MOT, SEN, ORD) attribute values are retrieved
- The ranks are retrieved as follows (case insensitive) :
  - From a skill branch containing _"pilotage"_ in its name for the character at the PIL station
  - From a skill branch containing _"moteurs"_ in its name for the character at the MOT station
  - From a skill branch containing _"electronique"_ in its name for the character at the SEN and ORD stations
  - From a skill branch containing _"armes lourdes"_ in its name for the character(s) at the CAN station

## 2021-02-16 - Version 2.21

- All function can be run using either

  ```
  Syntax : !co-function <args>
  ```

  or

  ```
  Syntax : !colib <function> <args>
  ```

## 2020-09-01 - Version 2.20

- Added function to import data into journal and optionnaly to character sheet

```
Syntax: !colib import handoutname [--charid=id]
```

Where:

- _handoutname_ is the name of an handout, which must start with _import._ and has Chroniques Mobiles JSON data pasted as plain text into the GM notes field
- _--charid=id_ is a character sheet identifier, which can be passed using some Roll20 syntax such as @{character name|character_id} or @{selected|character_id} if a token linked to a character sheet is currently selected on the VTT page.

The function will parse the JSON data, will create a handout for each individual ability (or will update an existing handout that exists under the same name), then will update the source handout, renaming it to _Profil : profile name_ and inserting the list of paths and abilities ordered by rank numbers in the Notes field.

To extract profile data out of the Chroniques Mobiles database and its API, output it as a JSON string and copy it to the clipboard, use the application available at https://comob-data.rpgapps.net.

## 2020-04-20 - Version 2.10

- Added functions to set token markers

```
Syntax: !colib token +set:marker[,marker] -set:marker[,marker]
```

Where _marker_ is a marker name, optionnaly suffixed by **@n** to display a badge over the token marker (1 < **n** < 9)

All token markers specified in the **+set:** argument will be displayed on the token as long as they are found in the list of status markers for the campaign (either standard/legacy or custom). Those specified in the **-set:** argument will be removed from the token.

```
Syntax: !colib token --set:marker[,marker]
```

Where _marker_ is a marker name, prefixed by **+** to set it or by **-** to unset it, and optionnaly suffixed by **@n** to display a badge over the token marker (1 < **n** < 9)

## Version 2.00

- The script has been re-worked and all the useful and not so useful functions have been documented.

## Version 1.00

All the following chat commands require that a single token is selected by the user who invokes it

```
Syntax : !colib actions --voies
```

Displays a chat menu with one button for each of the paths specified in the charsheet abilities grid. Only those paths that have a name are displayed.

```
Syntax : !colib actions --voie n
```

Displays a chat menu for the specified path number. Only those ranks that have a name entered in the abilities grid are displayed. The chat menu consists of a link to a journal handout if such an handout matching the name of the rank is found, and/or an ability button if an ability named **VxRy** is found in the charsheet, where **x** is the path number and **y** is the rank number.

```
Syntax : !colib actions --competences
```

Displays a chat menu with one button for each of the rolls specified in the repeating list of abilities (under the ability grid)

```
Syntax : !colib actions --attaques
```

Displays a chat menu with one button for each of the rolls specified in the repeating list of attacks.
