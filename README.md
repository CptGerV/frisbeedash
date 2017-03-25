# FrisbeeDash

FrisbeeDash est un jeu web de type “windjammer-like” où le joueur peut se déplacer, attraper et renvoyer un frisbee à son adversaire de plusieurs manières.
Le but du jeu étant de marquer un maximum de points en envoyant le frisbee dans les cages adverses et ainsi remporter la partie.
Ce projet propose de rassembler l’application de divers technologies web essentiellement basé sur le JavaScript.
Ici est proposé un serveur de jeu et un serveur d'authentification,celui-ci permettant d'avoir accès aux services du serveur de jeu.
Ici les technologies utilisées sont essentiellement basé sur JavaScript et ses framework.
Pour jouer, l'utilisateur a le choix entre entre rejoindre le matchmaking ou affronter l'inteligence artificiel au travers du client.

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
npm install --save express socket.io body-parser helmet socketio-jwt box-collide shortid mongoose request
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
npm install --save express body-parser morgan mongoose bcrypt shortid jsonwebtoken
```

# Installation

```bash
git clone https://github.com/CptGerV/frisbeedash.git
nodemon auth_server/server.js
nodemon frisbeedash/app.js
```

# Usage
# Mise en production
Les serveurs sont configurés pour fonctionner en local.
Pour changer l'adresse IP:
```bash
sed -i "s@auth_server = "localhost@auth_server = "ip_du_serveur_authentification@g" FrisbeeDashJS/app.js FrisbeeDashJS/Room.js FrisbeeDashJS/javascripts/game.js
sed -i "s@game_server = "localhost@game_server = "ip_du_serveur_de_jeu@g" FrisbeeDashJS/javascripts/game.js FrisbeeDashJS/javascripts/game_helper.js
```
# Contributing

1. Pull it
2. Create your feature branch (`git checkout -b features/my-new-feature`)
3. Commit your changes (`git commit -am 'Add some feature'`)
4. Push to the branch (`git push origin features/my-new-feature`)
5. If you're confident, merge your changes into master.