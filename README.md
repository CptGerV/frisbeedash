# FrisbeeDash

FrisbeeDash est un jeu web de type “windjammer-like” où le joueur peut se déplacer, attraper et renvoyer un frisbee à son adversaire de plusieurs manières.
Le but du jeu est de marquer un maximum de points en envoyant le frisbee dans les cages adverses et ainsi remporter la partie.
Ce projet propose de rassembler l’application de divers technologies web, essentiellements basées sur le JavaScript.
Un serveur de jeu et un serveur d'authentification sont à disposition, ce dernier permettant d'obtenir un token donnant accès aux services du serveur de jeu.
Les technologies utilisées sont essentiellement basées sur JavaScript et ses framework.
Pour jouer, l'utilisateur a le choix entre entre rejoindre le matchmaking ou affronter l'inteligence artificiel après s'être identifier au travers du client.

# Développement

Le code front-end se trouve dans FrisbeeDashJS/public/, le code back-end est dans FrisbeeDashJS/*.js.
La description des webservices du serveur d'authentification se trouve dans auth_server/swagger_auth_server.yaml, généré avec http://editor.swagger.io/#!/.
Vous pouvez lire les commentaires dans le code pour avoir plus de détails sur son fonctionnement.

# Requirements

* nodejs
* nodemon
# FrisbeeDashJs:
* express
* socket.io
* socketio-jwt
* body-parser
* helmet
* box-collide
* serve-favicon
* shortid
* mongoose
* request
```bash
cd frisbeedash
npm install
```
# Serveur authentification
* express
* body-parser
* morgan
* mongoose
* bcrypt
* shortid
* jsonwebtoken
```bash
cd auth_server
npm install
```

# Installation & Usage

```bash
git clone https://github.com/CptGerV/frisbeedash.git
nodemon auth_server/server.js
nodemon frisbeedash/app.js
```

# Configuration

Les serveurs sont configurés pour fonctionner en local.
Pour changer l'adresse IP:
```bash
sed -i "s@auth_server = "localhost@auth_server = "ip_du_serveur_authentification@g" FrisbeeDashJS/app.js FrisbeeDashJS/Room.js FrisbeeDashJS/javascripts/game.js
sed -i "s@game_server = "localhost@game_server = "ip_du_serveur_de_jeu@g" FrisbeeDashJS/javascripts/game.js FrisbeeDashJS/javascripts/game_helper.js
```

# Contributing

1. Créez votre branche de fonctionnalité (git checkout -b features/my-new-feature)
2. Validez vos modifications (git commit -am 'Ajouter une fonctionnalité')
3. Poussez vers la branche (git push origin features/my-new-feature)
4. Si vous êtes confiant, fusionnez vos modifications avec la branche master.