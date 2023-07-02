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

  let ul = document.createElement("ul");
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

  
  // tallenna data sen mahdollisten muutosten jälkeen aina localStorageen: 
  // localStorage.setItem("TIEA2120-vt3-2023", JSON.stringify(data));
  // kts ylempää mallia
  // varmista, että sovellus toimii oikein omien tallennusten jälkeenkin
  // eli näyttää sivun uudelleen lataamisen jälkeen edelliset lisäykset ja muutokset
  // resetoi rakenne tarvittaessa lisäämällä sivun osoitteen perään ?reset=1
  // esim. http://users.jyu.fi/~omatunnus/TIEA2120/vt2/pohja.xhtml?reset=1

}

window.addEventListener("load", alustus);
