# Commandes

Toutes les commandes marquées d'un [x] nécessitent qu'un et un seul token soit sélectionné par l'utilisateur qui l'invoque (généralement le token représentant son personnage).

---
```
Syntaxe : !co-actions --voies 
```
[x] Affiche un menu dans le chat avec un bouton pour chaque voie dont le nom est renseigné dans la grille des capacités de la fiche de personnage.

---
```
Syntaxe : !co-actions --voie n
```
[x] Affiche un menu dans le chat pour les capacités de la voie spécifiée, où **n** est compris entre 1 et 9. Ce menu contient une entrée pour chaque capacité possédée par le personnage (cochée dans la grille des capacités). Chaque entrée consiste en un lien vers le journal si le script trouve une aide de jeu portant le même nom que la capacité, et éventuellement un bouton permettant de faire un jet dans le chat. Pour ce faire, le script cherche dans la fiche de personnage, soit une **ability** nommée **VxRy** (où **x** est le numéro de la voie et **y** est le rang dans la voie), soit un jet de capacité qui a été préalablement lié au numéro de voie et au rang.

---
```
Syntaxe : !co-actions --competences
```
[x] Affiche un menu dans le chat avec un bouton pour chacun des jets spécifiés dans la liste des jets de capacités (sous la grille des capacités).

---
```
Syntaxe : !co-actions --attaques
```
[x] Affiche un menu dans le chat avec un bouton pour chacun des jets spécifiés dans la liste des attaques.

---
**Disponible en version 2.10**
```
Syntaxe : !co-token +set:marker[,marker] -set:marker[,marker]
```

[x] Ajoute ou retire un ou plusieurs marqueurs au token.

Où _marker_ est un nom de marqueur, optionnellement suffixé par **@n** pour afficher un badge par dessus le marqueur (avec **n** compris entre 1 et 9).

Tous les marqueurs spécifiés dans le paramètre **+set:** sont affichés sur le token s'ils sont trouvés dans le jeu de marqueur assigné à la campagne (soit le jeu de marqueurs standard, soit un jeu personnalisé). Ceux spécifiés dans le paramètre **-set:** sont supprimés du token.

```
Syntaxe : !co-token --set:marker[,marker]
```

[x] Ajoute ou retire un ou plusieurs marqueurs au token.

Où _marker_ est un nom de marqueur, préfixé par **+** pour l'ajouter au token ou par **-** pour le retirer, et optionnellement suffixé par **@n** pour afficher un badge par dessus le marqueur (avec **n** compris entre 1 et 9).

---
**Disponible en version 2.20**

```
Syntaxe : !co-import handoutname [--charid=id]
```

Où :

- _handoutname_ est le nom d'une aide de jeu (handout), qui doit commencer par _import._ et dont le champ GM notes a été rempli avec des données JSON issues de l'API publique de l'application Chroniques Mobiles.
- _--charid=id_ est un identifiant de personnage, qui peut être passé à la commande à l'aide de l'une des syntaxes de Roll20 comme par exemple ```@{character name|character_id}``` ou ```@{selected|character_id}``` si un token lié à une fiche de personnage est actuellement sélectionné sur la page en cours.

Le script analyse les données JSON trouvées dans le champ **GM Notes**, crée une aide de jeu (handout) pour chaque capacité trouvée (ou bien met à jour l'aide de jeu si elle existe déjà), puis il met à jour l'aide de jeu spécifiée, en la renommant en _Profil : nom du profil_ et en insérant dans le champ **Notes** une liste des voies et des capacités par voie, avec un lien vers les aides de jeu de capacité précédemment créés ou mises à jour.

L'application [Export Chroniques Mobiles](http://comob-data.rpgapps.net) permet d'extraire les données de l'API de Chroniques Mobiles, de les transformer en chaîne JSON et de copier celle-ci dans le presse-papier, avant de la coller dans l'aide de jeu sur Roll20. 

Il est également possible d'insérer les données JSON de voies et capacités dans la fiche de personnage sans passer par un script API (license Roll20 gratuite).
[Cliquer ici pour plus de détail](https://stephaned68.github.io/ChroniquesContemporaines/import-abilities)
