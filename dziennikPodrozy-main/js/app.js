// czekamy, aż cały dokument HTML zostanie załadowany
document.addEventListener("DOMContentLoaded", () => {

    // --- funkcja przelaczania widokow --- //
    function przelaczWidok() {
        // sprawdz obecny hash lub domyslny start
        let hash = window.location.hash || "#start";
        
        // ukryj wszystkie widoki
        const wszystkieWidoki = document.querySelectorAll('.widok');
        wszystkieWidoki.forEach(widok => widok.classList.add('d-none'));

        // dopasuj hash do id elementu 
        let idWidoku = hash.replace("#", "widok-"); 
        
        // pokaz wybrany widok
        const docelowyWidok = document.getElementById(idWidoku);
        if (docelowyWidok) docelowyWidok.classList.remove('d-none');

        // zresetuj aktywne linki w menu
        const linkiMenu = document.querySelectorAll('.nav-link');
        linkiMenu.forEach(link => {
            link.classList.remove('active');
            // podswietl aktualny link
            if (link.getAttribute('href') === hash) link.classList.add('active');
        });
    }

    // wywolaj przy starcie
    przelaczWidok();

    // nasluchuj zmiany adresu
    window.addEventListener('hashchange', przelaczWidok);



    // obsluga formularza i zapis danych do localstorage
    
    const formularz = document.getElementById('formularz-podrozy');
    let edytowanyIndeks = null; // zmienna mowiaca nam czy edytujemy wyjazd

    if(formularz) {
        formularz.addEventListener('submit', function(event) {
            // blokada przeladowania strony
            event.preventDefault(); 
            
            // sprawdz czy formularz jest poprawnie wypelniony
            if (!formularz.checkValidity()) {
                event.stopPropagation();
                formularz.classList.add('was-validated');
                return;
            }

            // zbieranie danych z formularza
            const nazwa = document.getElementById('nazwa-wyjazdu').value;
            const data = document.getElementById('data-wyjazdu').value;
            const cel = document.getElementById('cel-podrozy').value;
            // pobierz wybrana opcje transportu
            const transport = document.querySelector('input[name="transport"]:checked').value;
            
            // przygotuj tablice na zaznaczone opcje
            const checklista = [];
            document.querySelectorAll('input[type="checkbox"]:checked').forEach(box => {
                checklista.push(box.value);
            });

            // stworz obiekt nowej podrozy
            const nowaPodroz = { nazwa, data, cel, transport, checklista };
            // pobierz baze z pamieci (lub stworz pusta tablice)
            let bazaPodrozy = JSON.parse(localStorage.getItem('dziennikPodrozy')) || [];

            // sprawdzanie czy edytujemy czy dodajemy nowy wyjazd
            if (edytowanyIndeks !== null) {
                bazaPodrozy[edytowanyIndeks] = nowaPodroz; // nadpisanie starego wyjazdu
                alert("Zmiany zostały zapisane!");
                edytowanyIndeks = null; // resetowanie stanu edycji
            } else {
                bazaPodrozy.push(nowaPodroz); // dodanie nowego wyjazdu
                alert("Podróż pomyślnie zapisana!"); // komunikat wyswietlany po dodaniu podrozy
            }

            // zapisz aktualizowana baze w localstorage
            localStorage.setItem('dziennikPodrozy', JSON.stringify(bazaPodrozy));

            // resetowanie formularza i powrót do wyglądu dodawania
            formularz.reset();
            // wyczysc style walidacji
            formularz.classList.remove('was-validated');
            
            // przywroc domyslne napisy w formularzu
            const naglowek = document.querySelector('#widok-dodaj .card-header h2');
            const przycisk = document.querySelector('#formularz-podrozy button[type="submit"]');
            if(naglowek) naglowek.innerHTML = 'Dodaj nową podróż';
            if(przycisk) przycisk.innerHTML = 'Zapisz podróż';

            // przekierowanie do widoku listy
            window.location.hash = "#lista";
            // odswiez widok tabeli
            odswiezListe();
        });
    }

    // --- odczyt danych i generowanie listy kart --- //
    function odswiezListe() {
        const kontener = document.getElementById('kontener-tabeli');
        if (!kontener) return;

        // pobierz baze z localstorage
        const bazaPodrozy = JSON.parse(localStorage.getItem('dziennikPodrozy')) || [];

        // jesli baza pusta pokaz info
        if (bazaPodrozy.length === 0) {
            kontener.innerHTML = '<p class="text-muted text-center mt-5">Jeszcze nic tu nie ma. Dodaj swoją pierwszą podróż!</p>';
            return;
        }

        // start budowania siatki
        let htmlSiatki = '<div class="row g-4">';

        // petla przez kazdy wpis
        bazaPodrozy.forEach((podroz, index) => {
            
            // przygotuj checkliste (polacz w string)
            const rzeczyDoWziecia = podroz.checklista && podroz.checklista.length > 0 
                ? podroz.checklista.join(', ') 
                : '<span class="text-muted">Nic nie zaznaczono</span>';

            // zamien kod na ladna nazwe
            let celWyswietlany = podroz.cel;
            if(celWyswietlany === 'wypoczynek') celWyswietlany = 'Wypoczynek / Relaks';
            if(celWyswietlany === 'zwiedzanie') celWyswietlany = 'Zwiedzanie / Kultura';
            if(celWyswietlany === 'praca') celWyswietlany = 'Wyjazd Służbowy';

            // dodaj karte do htmla
            htmlSiatki += `
                <div class="col-md-4">
                    <div class="card h-100 shadow-sm border-0 border-top border-primary border-3">
                        <div class="card-body">
                            <h3 class="h5 card-title fw-bold text-primary mb-1">${podroz.nazwa}</h3>
                            <p class="h6 card-subtitle mb-4 text-muted">${podroz.data}</p>
                            
                            <p class="card-text mb-1"><strong>Cel:</strong> ${celWyswietlany}</p>
                            <p class="card-text mb-1"><strong>Transport:</strong> ${podroz.transport}</p>
                            <p class="card-text mt-3 mb-0"><strong>Co zabrać:</strong></p>
                            <p class="card-text small text-primary">${rzeczyDoWziecia}</p>
                        </div>
                        <div class="card-footer bg-white border-0 pt-0 pb-3 text-center d-flex justify-content-between gap-2">
                            <button onclick="edytujPodroz(${index})" class="btn btn-outline-primary btn-sm w-50">Edytuj</button>
                            <button onclick="usunPodroz(${index})" class="btn btn-outline-danger btn-sm w-50">Usuń</button>
                        </div>
                    </div>
                </div>
            `;
        });

        // zamknij rzad
        htmlSiatki += '</div>'; 
        // wrzuc gotowy html do kontenera
        kontener.innerHTML = htmlSiatki; 
    }

    // funkcja usuwania wyajzdu
    window.usunPodroz = function(indeks) {
        if(confirm("Czy na pewno chcesz usunąć tę podróż?")) {
            let bazaPodrozy = JSON.parse(localStorage.getItem('dziennikPodrozy')) || [];
            
            // Metoda splice wycina 1 element na wskazanym indeksie
            bazaPodrozy.splice(indeks, 1); 
            
            localStorage.setItem('dziennikPodrozy', JSON.stringify(bazaPodrozy));
            odswiezListe(); // Odświeżamy listę po usunięciu
        }
    };

    
    // odswiezanie listy przy uruchomieniu strony
    odswiezListe();





    //funkcja edycji wyjazdu
    window.edytujPodroz = function(indeks) {
        const bazaPodrozy = JSON.parse(localStorage.getItem('dziennikPodrozy')) || [];
        const podroz = bazaPodrozy[indeks];
        
        if (!podroz) return;

        // globalna zmienna na indeks wyjazdu
        edytowanyIndeks = indeks;

        //wkladanie tekstu i daty do formularza
        document.getElementById('nazwa-wyjazdu').value = podroz.nazwa;
        document.getElementById('data-wyjazdu').value = podroz.data;
        document.getElementById('cel-podrozy').value = podroz.cel;

        //  zaznaczamy odpowiednie radio 
        const radios = document.querySelectorAll('input[name="transport"]');
        radios.forEach(radio => {
            radio.checked = (radio.value === podroz.transport);
        });


        // zaznaczamy odpowiednie checkboxy
        const checkboxes = document.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(box => {
            box.checked = podroz.checklista && podroz.checklista.includes(box.value);
        });



        // zmiana tytulu formularza i przycisku podczas edytowania
        const naglowek = document.querySelector('#widok-dodaj .card-header h2');
        const przycisk = document.querySelector('#formularz-podrozy button[type="submit"]');
        if(naglowek) naglowek.innerHTML = 'Edytuj podróż';
        if(przycisk) przycisk.innerHTML = 'Zapisz zmiany';

        // 5. Przerzucamy użytkownika do zakładki formularza
        window.location.hash = '#dodaj';
    };

    // zabezpieczenie powrotu z edycji
    window.addEventListener('hashchange', () => {
        if (window.location.hash === '#dodaj' && edytowanyIndeks === null) {
            const formularzDodawania = document.getElementById('formularz-podrozy');
            if(formularzDodawania) formularzDodawania.reset();
            
            const naglowek = document.querySelector('#widok-dodaj .card-header h2');
            const przycisk = document.querySelector('#formularz-podrozy button[type="submit"]');
            if(naglowek) naglowek.innerHTML = 'Dodaj nową podróż';
            if(przycisk) przycisk.innerHTML = 'Zapisz podróż';
        } else if (window.location.hash !== '#dodaj') {
            edytowanyIndeks = null; 
        }
    });

    //jeśli użytkownik kliknie w menu Dodaj podróż, upewniamy się że czyścimy stan edycji
    window.addEventListener('hashchange', () => {
        if (window.location.hash === '#dodaj' && edytowanyIndeks === null) {
            const formularzDodawania = document.getElementById('formularz-podrozy');
            if(formularzDodawania) formularzDodawania.reset();
            
            const naglowek = document.querySelector('#widok-dodaj .card-header h2');
            const przycisk = document.querySelector('#formularz-podrozy button[type="submit"]');
            if(naglowek) naglowek.innerHTML = 'Dodaj nową podróż';
            if(przycisk) przycisk.innerHTML = 'Zapisz podróż';
        } else if (window.location.hash !== '#dodaj') {
            // Jeśli wyszedł z zakładki w trakcie edytowania bez zapisu
            edytowanyIndeks = null; 
        }
    });

    // odswiezenie listy przy starcie aplikacji
    odswiezListe();

});

// fetch api- pobieranie porad dnia z pliku json i losowanie porady
    function pobierzPorade() {
        const kontenerPorady = document.getElementById('porada-dnia');
        
        // czy kontener pojawil sie na stronie
        if (!kontenerPorady) return;

        // uzycie fetch api do asynchronicznego pobraniu pliku json
        fetch('porady.json')
            .then(response => {
                // Sprawdzamy, czy plik został poprawnie znaleziony
                if (!response.ok) {
                    throw new Error('Nie udało się pobrać pliku');
                }
                // tlumaczenie pliku json na obiekt js
                return response.json();
            })
            .then(porady => {
                //losowanie porady z pobranej tablicy
                const losowyIndeks = Math.floor(Math.random() * porady.length);
                const wylosowanaPorada = porady[losowyIndeks];
                
                // wrzucanie tekstu na strone
                kontenerPorady.innerHTML = `<strong> Porada na dziś:</strong> ${wylosowanaPorada}`;
            })
            .catch(error => {
                //w razie braku pliku pokazywany jest komunikat 
                console.error('Błąd Fetch API:', error);
                kontenerPorady.innerHTML = "Gotowy na kolejną przygodę? Zaplanuj ją z nami!";
            });
    }

    // uruchomienie pobierania porady przy starcie aplikacji
    pobierzPorade();

//  animacje przy scrollowaniu
    const kartyInspiracji = document.querySelectorAll('.animacja-scroll');

    // tworzymy obserwatora
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            // jesli element pojawil sie w oknie przegladarki
            if (entry.isIntersecting) {
                entry.target.classList.add('pokaz'); // dodanie nowej klasy pokazujacej
                observer.unobserve(entry.target); // Przestań obserwować (animacja zagra tylko raz)
            }
        });
    }, {
        threshold: 0.1 // animacja rusza gdy 10% elementu jest widoczne
    });

    // podpiecie obserwatora do wszystkich kart inspiracji
    kartyInspiracji.forEach(karta => {
        observer.observe(karta);
    });


// --- 7. NARZĘDZIA PODRÓŻNIKA (Fetch API - NBP) --- //
    function pobierzKursyNBP() {
        const kontenerWalut = document.getElementById('kursy-walut');
        
        if (!kontenerWalut) return;

        // pokazdanie krecacego sie kolka podczas pobierania danych
        kontenerWalut.innerHTML = `
            <div class="text-center my-4">
                <div class="spinner-border text-primary" role="status"></div>
                <div class="text-muted mt-2">Łączenie z serwerami NBP...</div>
            </div>
        `;

        const urlNBP = 'https://api.nbp.pl/api/exchangerates/tables/A/?format=json';

        fetch(urlNBP)
            .then(response => {
                if (!response.ok) throw new Error('Brak odpowiedzi z NBP'); // sprawdzenie serwera czy odpowiedz jest poprawna
                return response.json();
            })
            .then(data => {
                const tabelaKursow = data[0].rates;
                
                // kody walut które chcemy wyświetlic
                const kodyWalut = ['EUR', 'USD', 'CHF', 'GBP', 'CZK', 'SEK', 'DKK', 'NOK', 'HUF', 'AUD','JPY', 'CNY'];

                // rozpoczecie budowania siatki bootstrapa
                let htmlSiatki = '<div class="row g-3">';

                // petla przechodzaca przez liste
                kodyWalut.forEach(kod => {
                    // znajdowanie waluty w danych z NBP
                    const waluta = tabelaKursow.find(w => w.code === kod);
                    
                    if (waluta) {
                        // jesli waluta jest warta mniej niz 1 pln pokazuje 4 miejsca po przecinku
                        const kurs = waluta.mid < 1 ? waluta.mid.toFixed(4) : waluta.mid.toFixed(2);

                        // dodanie pojedycznego kafelka do siatki
                        htmlSiatki += `
                            <div class="col-6 col-sm-4">
                                <div class="p-2 border rounded bg-light text-center shadow-sm h-100">
                                    <span class="badge bg-secondary mb-1">1 ${waluta.code}</span>
                                    <h5 class="text-primary fw-bold mb-0">${kurs} <span class="fs-6 text-muted">PLN</span></h5>
                                </div>
                            </div>
                        `;
                    }
                });

                htmlSiatki += '</div>'; // zamkiniecie siatki

                // dodajemy gotowe kafelki do strony
                kontenerWalut.innerHTML = htmlSiatki;
            })
            .catch(error => {
                console.error('Błąd pobierania walut:', error);
                kontenerWalut.innerHTML = `<div class="alert alert-danger">Nie udało się pobrać aktualnych kursów. Spróbuj później.</div>`;
            });
    }

    pobierzKursyNBP();



    // widzet pogodowy open-meteo api pobieranie pogody dla wybranego miasta
    const selectMiasto = document.getElementById('wybor-miasta');
    const kontenerPogody = document.getElementById('wynik-pogody');

    function pobierzPogode() {
        if (!kontenerPogody || !selectMiasto) return;


        const koordynaty = selectMiasto.value.split(',');
        const lat = koordynaty[0];
        const lon = koordynaty[1];

        kontenerPogody.innerHTML = `
            <div class="spinner-border text-info my-4" role="status"></div>
            <div class="text-muted">Pobieranie prognozy...</div>
        `;

        // prosimy o prognoze pogody dla 7 dni dla wybranego miasta
        const urlPogoda = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=auto`;

        fetch(urlPogoda)
            .then(response => {
                if (!response.ok) throw new Error('Błąd pobierania pogody'); // sprawdzanie polaczenia z serwerem
                return response.json();
            })
            .then(data => {
                const daily = data.daily;
                
                // tworzenie kontenera listy z prognoza pogody
                let htmlPrognozy = '<ul class="list-group list-group-flush text-start mt-3">';

                // przechodzenie petla przez 7 dni prognozy
                for(let i = 0; i < 7; i++) {
                    const dataDnia = new Date(daily.time[i]);
                    
                    // zmiana daty na nazwe dnia tygodnia w jezyku polskim
                    const nazwaDnia = dataDnia.toLocaleDateString('pl-PL', { weekday: 'short' });
                    
                    // zaokraglenie temperatur i pobranie kodu pogody dla danego dnia
                    const maxTemp = Math.round(daily.temperature_2m_max[i]);
                    const minTemp = Math.round(daily.temperature_2m_min[i]);
                    const code = daily.weathercode[i];

                    //dodanie ikon do kodow pogody open- meteo
                    let ikonka = '🌤️';
                    if (code === 0) ikonka = '☀️';
                    else if (code >= 1 && code <= 3) ikonka = '⛅';
                    else if (code >= 45 && code <= 48) ikonka = '🌫️';
                    else if (code >= 51 && code <= 67) ikonka = '🌧️';
                    else if (code >= 71 && code <= 77) ikonka = '❄️';
                    else if (code >= 95) ikonka = '⛈️';

                    // tworzenie pojedynczego wiersza z prognoza pogody dla danego dnia
                    htmlPrognozy += `
                        <li class="list-group-item d-flex justify-content-between align-items-center bg-transparent px-0 py-2 border-bottom-0 border-top">
                            <span class="fw-bold w-25 text-uppercase" style="font-size: 0.9rem;">${i === 0 ? 'Dziś' : nazwaDnia}</span>
                            <span class="fs-4">${ikonka}</span>
                            <span class="text-muted w-50 text-end" style="font-size: 0.9rem;">
                                ${minTemp}° <span class="mx-1">/</span> <strong class="text-dark fs-6">${maxTemp}°C</strong>
                            </span>
                        </li>
                    `;
                }

                htmlPrognozy += '</ul>';
                kontenerPogody.innerHTML = htmlPrognozy;
            })
            .catch(error => {
                console.error(error);
                kontenerPogody.innerHTML = `<div class="alert alert-danger mt-3">Nie udało się załadować pogody.</div>`;
            });
    }

    if(selectMiasto) pobierzPogode();

    if(selectMiasto) {
        selectMiasto.addEventListener('change', pobierzPogode);
    }

    
    // artykuly i mapy do nich -baza danych w formie obiektu js
    
    const bazaArtykulow = {
        'neuschwanstein': {
            tytul: 'Zamek Neuschwanstein: Królestwo z bajki',
            zdjecie: 'https://picsum.photos/id/1040/1200/500', 
            tresc: `
                <p class="lead">Położony na stromych skalnych ścianach w bawarskich Alpach zamek Neuschwanstein to bez wątpienia najbardziej ikoniczna budowla Niemiec.</p>
                <p>Został wzniesiony na polecenie ekscentrycznego króla Ludwika II Wittelsbacha, zwanego Bajkowym Monarchą. Król chciał stworzyć idealną, odizolowaną od świata kryjówkę, wzorowaną na średniowiecznych sagach rycerskich i operach Richarda Wagnera. Budowa była tak kosztowna, że niemal doprowadziła do bankructwa prywatny skarbiec króla.</p>
                <p>Co ciekawe, budowla ta posłużyła Waltowi Disneyowi jako bezpośrednia inspiracja do stworzenia zamku Śpiącej Królewny, który dziś kojarzy każde dziecko na świecie z czołówek filmowych.</p>
            `,
            mapa: '<iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d43423.44754769062!2d10.713554030635293!3d47.5575739818815!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f131!3m3!1m2!1s0x479cf7cda94291e1%3A0x6bfb10e9f1a04ec4!2sZamek%20Neuschwanstein!5e0!3m2!1spl!2spl!4v1717592000000!5m2!1spl!2spl" width="100%" height="450" style="border:0; border-radius: 8px;" allowfullscreen="" loading="lazy"></iframe>'
        },
        'dolomity': {
            tytul: 'Dolomity: Najpiękniejsze góry Europy',
            zdjecie: 'https://picsum.photos/id/1043/1200/500',
            tresc: `
                <p class="lead">Dolomity, położone w północno-wschodnich Włoszech, przez wielu alpinistów i fotografów uznawane są za najbardziej spektakularne pasmo górskie na świecie.</p>
                <p>Charakteryzują się potężnymi, pionowymi basztami skalnymi, monumentalnymi urwiskami i głębokimi, zielonymi dolinami. Ich nazwa pochodzi od minerału (dolomitu), z którego są zbudowane. W 2009 roku pasmo to zostało oficjalnie wpisane na listę światowego dziedzictwa UNESCO.</p>
                <p>Największą atrakcją dla miłośników trekkingu są słynne trzy wieże skalne – Tre Cime di Lavaredo, wokół których prowadzi jeden z najbardziej widowiskowych szlaków w Europie.</p>
            `,
            mapa: '<iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d175402.47355030236!2d11.838450125816912!3d46.540447386762395!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f131!3m3!1m2!1s0x4778396556ebbc7d%3A0xa193910c0e5a87ef!2sDolomity!5e0!3m2!1spl!2spl!4v1717592100000!5m2!1spl!2spl" width="100%" height="450" style="border:0; border-radius: 8px;" allowfullscreen="" loading="lazy"></iframe>'
        },
        'yosemite': {
            tytul: 'Park Narodowy Yosemite: Potęga dzikiej Ameryki',
            zdjecie: 'https://picsum.photos/id/1044/1200/500',
            tresc: `
                <p class="lead">Park Narodowy Yosemite w Kalifornii to serce pasma górskiego Sierra Nevada i jeden z najstarszych oraz najbardziej uwielbianych parków w USA.</p>
                <p>Słynie przede wszystkim z gigantycznych, granitowych monolitów. Dwa najbardziej znane to El Capitan – mekka wspinaczy z całego świata, oraz Half Dome o charakterystycznym, ściętym kształcie. Ponadto w parku można podziwiać majestatyczne lasy sekwoi, olbrzymie wodospady i dzikie zwierzęta, w tym niedźwiedzie brunatne.</p>
                <p>Dolina Yosemite oferuje zapierające dech w piersiach punkty widokowe, takie jak Tunnel View, z którego roztacza się panoramiczny widok na całą dolinę.</p>
            `,
            mapa: '<iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d201889.3789547514!2d-119.71536643194095!3d37.74100569766417!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f131!3m3!1m2!1s0x8096f2127161ac2d%3A0xad18e001878d6b14!2sPark%20Narodowy%20Yosemite!5e0!3m2!1spl!2spl!4v1717592200000!5m2!1spl!2spl" width="100%" height="450" style="border:0; border-radius: 8px;" allowfullscreen="" loading="lazy"></iframe>'
        },
        'monako': {
            tytul: 'Monte Carlo: Światowa stolica luksusu',
            zdjecie: 'monako.jpg', 
            tresc: `
                <p class="lead">Monte Carlo to najsłynniejsza dzielnica Księstwa Monako, znana na całym świecie z blichtru, wielkich pieniędzy i prestiżowych wydarzeń.</p>
                <p>Spacerując po tutejszym porcie, można podziwiać jachty miliarderów z całego globu. Głównym punktem programu jest jednak wizyta na placu przed słynnym kasynem, 
                gdzie parkują najdroższe samochody świata. Jeśli jesteś fanem motoryzacji, na pewno wiesz, że to właśnie ulicami Monte Carlo poprowadzony jest najbardziej legendarny tor w kalendarzu Formuły 1.</p>
                <p>Nawet jeśli nie planujesz grać w kasynie, samo podziwianie architektury Belle Époque i ogrodów wokół niego zapiera dech w piersiach!</p>
            `,
            mapa: '<iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d5761.352467771743!2d7.424368576402772!3d43.73977324716943!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f131!3m3!1m2!1s0x12cdc2ec7a62725f%3A0x5e79b9a4c849cf0!2sCasino%20de%20Monte-Carlo!5e0!3m2!1spl!2spl!4v1717592400000!5m2!1spl!2spl" width="100%" height="450" style="border:0; border-radius: 8px;" allowfullscreen="" loading="lazy"></iframe>'
        },
        'tatry': {
            tytul: 'Tatry: Korona polskich i słowackich gór',
            zdjecie: 'tatry.jpg',
            tresc: `
                <p class="lead">Tatry to najwyższe pasmo górskie w łańcuchu Karpat, stanowiące naturalną granicę między Polską a Słowacją.</p>
                <p>Mimo stosunkowo niewielkiej powierzchni, Tatry mają charakter alpejski. Zachwycają ostrymi, granitowymi szczytami, głębokimi polodowcowymi dolinami oraz krystalicznie czystymi stawami, z których najsłynniejsze to położone po polskiej stronie Morskie Oko.</p>
                <p>To idealne miejsce zarówno dla wymagających taterników wspinających się na Orlą Perć czy Rysy, jak i dla spacerowiczów szukających wytchnienia na pięknych tatrzańskich halach.</p>
            `,
            mapa: '<iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d10408.318287893946!2d20.063717544062536!3d49.20015520869688!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f131!3m3!1m2!1s0x4715f36e4f35835b%3A0xa6eb3d3f972b260!2sTatry!5e0!3m2!1spl!2spl!4v1717592500000!5m2!1spl!2spl" width="100%" height="450" style="border:0; border-radius: 8px;" allowfullscreen="" loading="lazy"></iframe>'
        },
        'japonia': {
            tytul: 'Japonia: Pod świętą Górą Fudżi',
            zdjecie: 'japonia.jpg',
            tresc: `
                <p class="lead">Góra Fudżi (Fuji-san) to najwyższy szczyt Japonii (3776 m n.p.m.) i jeden z najbardziej rozpoznawalnych, świętych symboli tego kraju.</p>
                <p>Ten czynny stratowulkan, często otoczony idealnym wieńcem chmur i pokryty śniegiem przez większość roku, od wieków stanowił obiekt kultu religijnego oraz inspirację dla japońskich artystów tworzących drzeworyty. Wspinaczka na Fudżi to niesamowite doświadczenie – wielu podróżników wyrusza w nocy, by powitać słońce stojąc na samym szczycie krateru.</p>
                <p>W połączeniu z wizytą w dawnej stolicy – Kioto – podróż ta pozwala w pełni dotknąć magii i harmonii Kraju Kwitnącej Wiśni.</p>
            `,
            mapa: '<iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d104117.84275151523!2d138.64775489814407!3d35.3606242398579!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f131!3m3!1m2!1s0x6019629a42fd6897%3A0x685516ed314ac82e!2sG%C3%B3ra%20Fud%C5%BCi!5e0!3m2!1spl!2spl!4v1717592600000!5m2!1spl!2spl" width="100%" height="450" style="border:0; border-radius: 8px;" allowfullscreen="" loading="lazy"></iframe>'
        }
    };

    // funkcja wlaczajaca artykul i mape do niego
    window.otworzArtykul = function(idArtykulu) {
        const artykul = bazaArtykulow[idArtykulu];
        if (!artykul) return;

        const kontener = document.getElementById('kontener-artykulu');
        if (!kontener) return;
        
        // rysowanie artykulu i mapy w kontenerze
        kontener.innerHTML = `
            <img src="${artykul.zdjecie}" class="img-fluid w-100 rounded mb-4 shadow-sm" style="max-height: 400px; object-fit: cover;" alt="${artykul.tytul}">
            <h1 class="text-primary fw-bold mb-4">${artykul.tytul}</h1>
            <div class="fs-5 text-secondary mb-5 lh-lg">
                ${artykul.tresc}
            </div>
            <h4 class="text-dark border-bottom pb-2 mb-4">Gdzie to jest?</h4>
            <div class="shadow-sm">
                ${artykul.mapa}
            </div>
        `;

        // ukrywamy wszystkie inne widoki na stronie
        document.querySelectorAll('.widok').forEach(w => w.classList.add('d-none'));
        
        // pokazujemy tylko widok artykulu
        const widokArtykulu = document.getElementById('widok-artykul');
        if (widokArtykulu) widokArtykulu.classList.remove('d-none');
        
        // przewwijanie strony do gory z animacja
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };