## EpiConcept (France)

La boite est assez grosse (beaucoup de medecins, epidemio, chefs de projets, etc...)

Apparement tous leurs produits sont basés sur un framework maison "voozanoo".
- 1 dev et un adminsys pour l'infra
- l'archi, le DT et 2 devs bossent sur le framework maison.
- ensuite trois équipes projet où se distribue les devs restant (2, 4, et 0)
http://www.epiconcept.fr/sites/default/files/images/organigram_avril2013fr.preview.png

Diposent de produits
- SagaStock Pharma: gestion de stock de médicaments, fork IsyStock pour MSF, adapté pour nous.
- Saga: Comptabilité pour ONG.
- homere: Gestion RH, contrats de travail, bulletins de salaire, le tout par pays.
- wepi: gratuit, gestion d'enquête épidémio/santé (sans suivre les patients)
- voozanoo: gratuit, gestion d'enquête épidémio/santé (en suivant les patients).

Autres produits
- BuDi (bulk dispatcher) et EpiFiles: Systèmes d'échanges de fichiers.

À voir:
Les sources de voozanoo sont-elle ouvertes?
Quelles sont les possibilités d'interconnection API?


## Groupe URD (urgence réhabilitation développement)

Le groupe URD propose des standard de qualité, et apparement des logiciels associé. C'est une asso 1901.
Groupement d'ONG. Ils sont derrière Sigmah, mais se limitent à récolter de l'argent et sous-traiter.


## BeDataDriven (Hollande)

Petite boite édite 3 softs en java (oss sur github au moins le 1er).
Ils inspirent confiance (leurs sites propres, modernes et dans les standards).

Ils font aussi du consulting sur les sujet suivants:
- R Language
- Hadoop
- Humanitarian Information Systems
- Predictive Analytics.

À savoir que la partie monitoring de Sigmah est en fait leur boulot pour ActivityInfo.
Si j'ai bien compris Ideia les a payé en sous-traitance pour intégrer les fonctionnalités de AI dans Sigmah.

## Ideia

Petite SSII française.
C'est eux qui bossent sur Sigmah sous les instructions de URD et des 10 ONGs qui sont derrière.

Ils font du drupal, du zend framework et du j2e.

En tout cas il y a des participations aux GSoC.

Leur offre d'emploi pour J2E: http://www.ideia.fr/emplois-formation/offres-demplois/ing%C3%A9nieur-javajee5
Page du blog oú ils parlent de sigmah: http://www.ideia.fr/ma%C3%AEtrise-d%C5%93uvre/nos-r%C3%A9alisations/ideia-con%C3%A7oit-une-plateforme-de-suivi-et-gestion-de-projets-d%C3%A9di%C3%A9e


## Ushahidi

Entreprise globale qui fait de l'opensource pour l'humanitaire.
J'ai découvert leur existence dans les annexes du guide de Sphere.

Ils ont 7 produits:

### Ushahidi

Make smart decisions with a data management system that rapidly collects data from the crowd and visualizes what happened, when and where.

Regroupe des streams de données (SMS, email, webform, twitter, ...).
Les ordonne sur timeline, maps, ...

Rien de très intéressant (pour nous)
Exemple d'utilisation http://www.ushahidi.com/2012/06/25/watertracker/


### Crowdmap

Comme le nom l'indique, outil collaboratif pour remplir les maps.
il y a une API pour integrer dans d'autres outils.

### Swiftriver

Crawler twitter, journaux, sms, email etc pour suivre des sujets.
Analyse semantique.

### CrisisNET

Crawler journaux pour tirer de l'information.

Dans l'exemple ils arrivent a construire une carte des zones les plus violentes en syrie automagically.
Pour faire la même carte la BBC à eu besoin de dizaines de personne pour regrouper toutes les infos remontées par son personnel sur le terrain.

### Ping

Service pour s'assurer que ses proches vont bien en cas de conflit.
Je trouve pas ça super crédible, si les telephones portables marchent on a pas besoin de ce genre d'outils.

### SMSSync

Appli android qui permet de bridger un service HTTP avec des SMS.

En gros on a un telephone connecté à internet,
- A chaque message recu il appelle une API
- Il appelle toutes les x secondes une API pour savoir si il doit envoyer des SMS.

Ça peut être interessant pour sync des données, à voir si ça vaut qqchose en pratique.

Aussi, POURQUOI FAIRE CA EN HTTP?????

### BRCK

Device pour fournir internet à la limite des reseaux.

Financé sur kickstarter

3g to wifi.
gsm to wifi
etc.
