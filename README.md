# Module Lizmap geopoppy

## Installation du module

Une fois que Lizmap Web Client est installé et fonctionnel, vous pouvez installer le module geopoppy.

Depuis la version 0.3.3 du module, il est souhaitable de l'installer avec [Composer](https://getcomposer.org),
le système de paquet pour PHP. Si vous ne pouvez pas, ou si vous utilisez
lizmap 3.3 ou inférieur, passez à la section sur l'installation manuelle.

### Installation automatique avec Composer et lizmap 3.4 ou plus

* dans `lizmap/my-packages`, créer le fichier `composer.json` s'il n'existe pas
  déjà, en copiant le fichier `composer.json.dist`, qui s'y trouve.
* en ligne de commande, dans le répertoire `lizmap/my-packages/`, tapez :
  `composer require "lizmap/lizmap-geopoppy-module"`
* Si vous utilisez Lizmap 3.6 et suivante, exécuter ensuite la commande de configuration :

```bash
php lizmap/install/configurator.php
```
* puis dans le répertoire `lizmap/install/`, lancer les commandes suivantes :

```bash
php installer.php
clean_vartmp.sh
set_rights.sh
```

### Installation manuelle dans lizmap 3.3 ou 3.4 sans Composer

* Télécharger l'archive ZIP de la dernière version du module dans [la page des releases de Github](https://github.com/3liz/lizmap-geopoppy-module/releases).
* Extraire l'archive et copier le répertoire `geopoppy` dans le répertoire `lizmap/lizmap-modules/` de l'application Lizmap Web Client.
* Éditer le fichier `lizmap/var/config/localconfig.ini.php` et modifier la section `[modules]` en ajoutant la ligne `geopoppy.access=2` sous la section :

```ini
[modules]
geopoppy.access=2
```

* puis dans le répertoire `lizmap/install/`, lancer les commandes suivantes :

```bash
php installer.php
clean_vartmp.sh
set_rights.sh
```
