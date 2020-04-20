# COlib
Companion API script for COF/COC/CG Roll20 character sheets

## 2020-04-20 - Version 2.10
* Added functions to set token markers
```
Syntax: !co-token +set:marker[,marker] -set:marker[,marker]
```
Where _marker_ is a marker name, optionnaly suffixed by **@n** to display a badge over the token marker (1 < **n** < 9)

All token markers specified in the **+set:** argument will be displayed on the token as long as they are found in the list of status markers for the campaign (either standard/legacy or custom). Those specified in the **-set:** argument will be removed from the token. 

```
Syntax: !co-token --set:marker[,marker]
```
Where _marker_ is a marker name, prefixed by **+** to set it or by **-** to unset it, and optionnaly suffixed by **@n** to display a badge over the token marker (1 < **n** < 9)

## Version 2.00

* The script has been re-worked and all the useful and not so useful functions have been documented.

## Version 1.00

All the following chat commands require that a single token is selected by the user who invokes it

```
Syntax : !co-actions --voies
```
Displays a chat menu with one button for each of the paths specified in the charsheet abilities grid. Only those paths that have a name are displayed.

```
Syntax : !co-actions --voie n
```
Displays a chat menu for the specified path number. Only those ranks that have a name entered in the abilities grid are displayed. The chat menu consists of a link to a journal handout if such an handout matching the name of the rank is found, and/or an ability button if an ability named **VxRy** is found in the charsheet, where **x** is the path number and **y** is the rank number.

```
Syntax : !co-actions --competences
```
Displays a chat menu with one button for each of the rolls specified in the repeating list of abilities (under the ability grid)

```
Syntax : !co-actions --attaques
```
Displays a chat menu with one button for each of the rolls specified in the repeating list of attacks.