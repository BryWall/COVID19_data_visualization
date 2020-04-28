# **Dashboard Covid-19**
_Par Bryan Wallez et Défente Romain_

***

### **Le site**

Rendez-vous sur [ici](https://data-visualization-enigma-4.netlify.app/) pour l'aperçu de notre projet.

***

### **Remarques**

Nous avons fait le choix de puiser dans 2 APIs distinctes : 
- [CSSEGISandData](https://github.com/CSSEGISandData/COVID-19)
- [coronavirus-tracker-api](https://coronavirus-tracker-api.herokuapp.com/)

L'utilisation de cette deuxième APIs était nécessaires pour avoir le nombre de malades guéris, cette donnée n'étant pas accessible dans la première API.
Certains graphes sont susceptibles de ne pas s'afficher avant rafraîchissement de la page, le site fonctionnant à base d'appels ajax et ces derniers renvoyant  parfois des données vides.