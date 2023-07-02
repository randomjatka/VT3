"use strict";  // pidä tämä ensimmäisenä rivinä
//@ts-check

// Alustetaan data, joka on jokaisella sivun latauskerralla erilainen.
// tallennetaan data selaimen localStorageen, josta sitä käytetään seuraavilla
// sivun latauskerroilla. Datan voi resetoida lisäämällä sivun osoitteeseen
// ?reset=1
// jolloin uusi data ladataan palvelimelta
// Tätä saa tarvittaessa lisäviritellä
function alustus() {
     // luetaan sivun osoitteesta mahdollinen reset-parametri
     // https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams
     const params = new window.URLSearchParams(window.location.search);
     let reset = params.get("reset");
     let data;
     if ( !reset  ) {
       try {
          // luetaan vanha data localStoragesta ja muutetaan merkkijonosta tietorakenteeksi
          // https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage
          data = JSON.parse(localStorage.getItem("TIEA2120-vt3-2023"));
       }
       catch(e) {
         console.log("vanhaa dataa ei ole tallennettu tai tallennusrakenne on rikki", data, e);
       }
       if (data) {
               console.log("Käytetään vanhaa dataa");
	       start( data );
               return;
           }
     }
     // poistetaan sivun osoitteesta ?reset=1, jotta ei koko ajan lataa uutta dataa
     // manipuloidaan samalla selaimen selainhistoriaa
     // https://developer.mozilla.org/en-US/docs/Web/API/History/pushState
     history.pushState({"foo":"bar"}, "VT3", window.location.href.replace("?reset="+reset, ""));
     // ladataan asynkronisesti uusi, jos reset =! null tai tallennettua dataa ei ole
     // https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch
	fetch('https://appro.mit.jyu.fi/cgi-bin/tiea2120/randomize_json.cgi')
	    .then(response => response.json())
	    .then(function(data) {
               console.log("Ladattiin uusi data", data);
               // tallennetaan data localStorageen. Täytyy muuttaa merkkijonoksi
	       // https://developer.mozilla.org/en-US/docs/Web/API/Storage/setItem
	       localStorage.setItem("TIEA2120-vt3-2023", JSON.stringify(data));
 	       start( data );
	    }
  	    );
}

// oma sovelluskoodi voidaan sijoittaa tähän funktioon
function start(data) {
  // tänne oma koodi
  console.log(data);

 
  let kohdeLista = document.getElementById("joukkuelistaukset");
  //let li = document.createElement("li");
  //ul.appendChild(li);

  /*let viiteSarjat = {}
  for (let sarja of data.sarjat) {
    sarja.id = sarja.kesto;
  }
  */

  let kohdeLomake = document.forms[0];
  let pohjaSarjat = Array.from(data.sarjat);
  let ekatKentat = kohdeLomake[0];

  let jarjestyswrapperi = function jarjestyswrapperi() {
    // Tehdään kopio joukkueista ja sisäiset kopioit jokaisen joukkueen jäsenistä jotta niiden järjestäminen ei sekoita alkuperäistä dataa
  let joukkueJarjestys = Array.from(data.joukkueet);
  for (let i=0; i<data.joukkueet.length-1; i++) {
    joukkueJarjestys[i].jasenet = Array.from(data.joukkueet[i].jasenet);
  }

  // Tällä funktiolla järjestetään joukkueet aakkosjärjestykseen.
  function joukkueJarjestamisfunktio(a,b){
		let tulos = a.nimi.localeCompare(b.nimi, 'fi', {sensitivity: 'base'});
		if (tulos) {
			return tulos;
		}
		return false;
	}

  function jasenienJarjestys(a,b){
    let tulos = a.localeCompare(b, 'fi', {sensitivity: 'base'});
    if (tulos) {
      return tulos;
    }
    return false;
  }

  joukkueJarjestys.sort(joukkueJarjestamisfunktio);
  for (let jarjestettava of joukkueJarjestys) {
    jarjestettava.jasenet.sort(jasenienJarjestys);
  }

  // Järjestetyt joukkueet tarkistus
  console.log(joukkueJarjestys);
  
  
  // Tässä kaksoissilmukassa luodaan kaikki joukkuelistaukset ja jokaiselle joukkueelle kaikki jäsenet
  let ul = document.createElement("ul");
  for (let joukkue of joukkueJarjestys) {
    //console.log(joukkue.nimi);
    let li = document.createElement("li");
    let viiteSarja = data.sarjat.find(element => element.id == joukkue.sarja).kesto;
    li.textContent = "Joukkue " + joukkue.nimi;
    let vahva = document.createElement("strong");
    vahva.textContent = " " + viiteSarja + " h";
    li.appendChild(vahva);
    let ulkaksi = document.createElement("ul");
    for (let jasen of joukkue.jasenet) {
      let likaksi = document.createElement("li");
      likaksi.textContent = "Jäsen " + jasen;
      ulkaksi.appendChild(likaksi);
    }
    li.appendChild(ulkaksi);
    ul.appendChild(li);
  }
  kohdeLista.appendChild(ul);
  };


  let lomakkeenTarkistukset = function lomakkeenTarkistukset(e) {
    e.preventDefault();
    
    //console.log("Lomakkeen submitti toimi!");
    // Etsitään lomakkeen jäsenet
    let jasenTaulukko = [];
    for (let syotekentta of kohdeLomake) {
      if (syotekentta.name == "jasen") {
        if (syotekentta.value != "") {jasenTaulukko.push(syotekentta.value);}
      }
    }
    // jos missään jäsenessä ei ollut sisältöä, ei jatketa joukkueen lisäystä
    // TODO: virheilmoitukset "Joukkueella on altava vähintään yksi jäsen" setCustomValidity() ja reportValidity()
    if (jasenTaulukko.length<1) {return;}
    console.log(jasenTaulukko);

    //Katsotaan, että lisättävän joukkueen nimi ei ole tyhjä ja se ei jo löydy pohjadatasta
    //TODO: reportValidity();
    if (kohdeLomake[1].value.trim() == "") {
      console.log("Joukkueen nimi oli tyhjä!");
      return;
    }
    for (let vertausJoukkue of data.joukkueet) {
      if (kohdeLomake[1].value.trim().localeCompare(vertausJoukkue.nimi.trim(), 'fi', {sensitivity: 'base'}) == 0) {
        console.log("Löytyi olemassa oleva nimi!");
        return;
      }
    }

    //Kun joukkueen syötteet on todettu validiksi, muodostetaan siitä lisättävä tietorakenne
    let lisattavaJoukkue = {};
    lisattavaJoukkue.nimi = kohdeLomake[1].value;
    
    //Asetetaan joukkueelle id perustuen valittuun radiobuttoniin
    for (let syotekentta of kohdeLomake) {
      if (syotekentta.name == "sarja") {
        if (syotekentta.checked) {
          console.log(syotekentta.value);
          lisattavaJoukkue.sarja = syotekentta.value;
        }
      }
    }
    lisattavaJoukkue.jasenet = jasenTaulukko;
    lisattavaJoukkue.leimaustapa = [0];
    lisattavaJoukkue.rastileimaukset = [];
    data.joukkueet.push(lisattavaJoukkue);
    //console.log(data.joukkueet);
    // Poistetaan vanha lista, muistaen että poistaessa listan pituus lyhenee koko ajan joten pituus pitää ottaa talteen etukäteen
	  let listanPituus = kohdeLista.children.length;
	  for (let i=0; i<listanPituus; i++) {
	  	kohdeLista.children[0].remove();
	  }
    // Kun uusi joukkue on lisätty tietorakenteeseen ja lista putsattu, kutsutaan uudestaan järjestysfunktiota
    jarjestyswrapperi();
  };

  kohdeLomake.addEventListener("submit", lomakkeenTarkistukset);

  // Järjestetään sarjojen kopiotaulukko aakkosjärjestykseen
  pohjaSarjat.sort((a, b) => {
    return a.nimi.localeCompare(b.nimi, 'fi', {sensitivity: 'base'});
  });

  // Syötetään pohjadatan sarjat lomakekentiksi
  for (let pohjaSarja of pohjaSarjat) {
    let otsikko = document.createElement("label");
    otsikko.textContent = pohjaSarja.nimi + " ";
    let syote = document.createElement("input");
    syote.type = "radio";
    syote.name = "sarja";
    syote.value = pohjaSarja.id;
    otsikko.appendChild(syote);
    ekatKentat.appendChild(otsikko);
  }

  // Asetetaan sarjalle oletusvalinta
  kohdeLomake[2].checked = "checked";

  jarjestyswrapperi();

  
  // tallenna data sen mahdollisten muutosten jälkeen aina localStorageen: 
  // localStorage.setItem("TIEA2120-vt3-2023", JSON.stringify(data));
  // kts ylempää mallia
  // varmista, että sovellus toimii oikein omien tallennusten jälkeenkin
  // eli näyttää sivun uudelleen lataamisen jälkeen edelliset lisäykset ja muutokset
  // resetoi rakenne tarvittaessa lisäämällä sivun osoitteen perään ?reset=1
  // esim. http://users.jyu.fi/~omatunnus/TIEA2120/vt2/pohja.xhtml?reset=1

}

window.addEventListener("load", alustus);
