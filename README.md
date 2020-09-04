# COlib

Companion API script for COF/COC/CG Roll20 character sheets

## 2020-09-01 - Version 2.20

- Added function to import data into journal and optionnaly to character sheet

```
Syntax: !co-import handoutname [--charid=id]
```

Where:

- _handoutname_ is the name of an handout, which must start with _import._ and has Chroniques Mobiles JSON data pasted as plain text into the GM notes field
- _--charid=id_ is a character sheet identifier, which can be passed using some Roll20 syntax such as @{character name|character_id} or @{selected|character_id} if a token linked to a character sheet is currently selected on the VTT page.

The function will parse the JSON data, will create a handout for each individual ability (or will update an existing handout that exists under the same name), then will update the source handout, renaming it to _Profil : profile name_ and inserting the list of paths and abilities ordered by rank numbers in the Notes field.

To extract profile data out of the Chroniques Mobiles database and its API, output it as a JSON string and copy it to the clipboard, use the application available at https://comob-data.rpgapps.net.

## 2020-04-20 - Version 2.10

- Added functions to set token markers


## Version 2.00

- The script has been re-worked and all the useful and not so useful functions have been documented.

## Version 1.00

All the following chat commands require that a single token is selected by the user who invokes it

---
```
Syntax : !co-actions --voies
```
Displays a chat menu with one button for each of the paths specified in the charsheet abilities grid. Only those paths that have a name are displayed.

---
```
Syntax : !co-actions --voie n
```
Displays a chat menu for the specified path number. Only those ranks that have a name entered in the abilities grid are displayed. The chat menu consists of a link to a journal handout if such an handout matching the name of the rank is found, and/or an ability button if either an ability named **VxRy** is found in the charsheet, where **x** is the path number and **y** is the rank number, or if a roll linked to the path and rank is found in the list of ability rolls.

---
```
Syntax : !co-actions --competences
```
Displays a chat menu with one button for each of the rolls specified in the repeating list of abilities (under the ability grid)

---
```
Syntax : !co-actions --attaques
```
Displays a chat menu with one button for each of the rolls specified in the repeating list of attacks.
<!--stackedit_data:
eyJoaXN0b3J5IjpbLTExOTcxMjY5N119
-->