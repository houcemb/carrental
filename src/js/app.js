
App = {
  web3Provider: null,
  contracts: {},
  carPhotos: {
    "Bmw": "images/bmwm5.jpg",
    "honda civic": "images/hondaCivic.jpg",
    "camaro": "images/camaro.jpg",
    // Add more image URLs as needed
  },
  defaultPhotoUrl: "images/fordFusion.jpg",
  init: function() {
    // Initialize web3 and contracts
    return App.initWeb3();
  },

  initWeb3: function() {
    // Modern dapp browsers
  if (window.ethereum) {
    window.web3 = new Web3(window.ethereum);
    try {
      // Request account access if needed
      window.ethereum.enable().then(function() {
        // Accounts now exposed
        App.web3Provider = window.web3.currentProvider;
        web3 = new Web3(App.web3Provider);
        console.log("Connected to user's web3 provider");
        return App.initContract();
      });
    } catch (error) {
      // User denied account access...
      console.error("User denied account access");
    }
  }
  // Legacy dapp browsers
  else if (window.web3) {
    App.web3Provider = window.web3.currentProvider;
    web3 = new Web3(App.web3Provider);
    console.log("Connected to injected web3 provider");
    return App.initContract();
  }
  // Fallback to a default provider if no web3 instance is detected
  else {
    App.web3Provider = new Web3.providers.HttpProvider('http://localhost:8545');
    web3 = new Web3(App.web3Provider);
    console.log("Connected to local provider");
    return App.initContract();
  }
},

  initContract: function() {
    // Initialize contract
    $.getJSON('Rental.json', function(data) {
      var RentalArtifact = data;
      App.contracts.Rental = TruffleContract(RentalArtifact);
      App.contracts.Rental.setProvider(App.web3Provider);
      return App.markRented();
    });
    return App.bindEvents();
  },

  markRented: function(rentals, account) {
    var rentalInstance;
    App.contracts.Rental.deployed().then(function(instance) {
      rentalInstance = instance;
      return rentalInstance.getCarCount();
    }).then(function(count) {
      App.getAllCars(rentalInstance, account, Number(count));
    }).catch(function(err) {
      console.log(err.message);
    });
  },

  getAllCars: function(rentalInstance, account, count) {
    var carsRow = $('#carsRow');
    var carTemplate = $('#carTemplate');
    carsRow.empty();
    for (i = 0; i < count; i++) {
      App.getCarInfo(rentalInstance, i).then(function(info) {
        var owner = info[2];
        var make = info[0];
        var isAvailable = info[4];
        carTemplate.find('.panel-title').text(make);
        carTemplate.find('.car-make').text(make);
        carTemplate.find('.car-licenseNumber').text(info[1]);
        carTemplate.find('.car-isAvailable').text(info[4]);
        carTemplate.find('.car-year').text(info[5]);
        carTemplate.find('.btn-rent').attr('data-id', info[6]);
        carTemplate.find('.btn-return').attr('data-id', info[6]);
        carTemplate.find('.btn-rent').attr('disabled', !isAvailable);

        // Get car type from the smart contract response (adjust the index based on your contract structure)

        var carTypePhotoUrl = App.carPhotos[make] || App.defaultPhotoUrl;

        // Set the image source to the corresponding photo URL
        carTemplate.find('.img-rounded').attr('src', carTypePhotoUrl);

        carTemplate.find('.btn-displayInfo').click(function() {
          App.displayCarInfo(info);
        });
        carsRow.append(carTemplate.html());
      });
    }
  },

  getCarInfo: async function(rentalInstance, i) {
    return await rentalInstance.getRentalCarInfo(i);
  },

  displayCarInfo: function(carInfo) {
    // Customize this function to display car details in a popup/modal
    // For example, you can use a modal from Bootstrap to display the information
    // Here, it's showing car details in an alert (replace this with your preferred UI)
    alert(JSON.stringify(carInfo));
  },
  handleRent: function(event) {
    event.preventDefault();

    var carId = parseInt($(event.target).data('id'));
    var rentalnInstance;

    web3.eth.getAccounts(function(error, accounts) {
      if (error) {
        console.log(error);
      }

      var account = accounts[0];

      App.contracts.Rental.deployed().then(function(instance) {
        rentalnInstance = instance;

        // Execute rent as a transaction by sending account
        return rentalnInstance.rent(carId, {from: account, gas:3000000});
      }).then(function(result, account) {

        return App.markRented(account);
      }).catch(function(err) {
        console.log(err.message);
      });
    });
  },

  handleAddCar: function(event) {
    event.preventDefault();

    var carId = parseInt($(event.target).data('id'));
    var rentalnInstance;

    web3.eth.getAccounts(function(error, accounts) {
      if (error) {
        console.log(error);
      }

      var account = accounts[0];

      App.contracts.Rental.deployed().then(function(instance) {
        rentalnInstance = instance;


        var make = document.getElementById("makeInfo").value;
        var owner = document.getElementById("owner").value;
        var year = document.getElementById("year").value;
        var license = document.getElementById("licenseNumber").value;

        // Execute rent as a transaction by sending account
        return rentalnInstance.addNewCar(make,owner,license,year, {from: account, gas:3000000});
      }).then(function(result) {
        return App.markRented();
      }).catch(function(err) {
        console.log(err.message);
      });
    });
  },


  handleReturnCar: function(event) {
    event.preventDefault();

    var carId = parseInt($(event.target).data('id'));
    var rentalnInstance;

    web3.eth.getAccounts(function(error, accounts) {
      if (error) {
        console.log(error);
      }

      var account = accounts[0];

      App.contracts.Rental.deployed().then(function(instance) {
        rentalnInstance = instance;


        console.log(carId);
        // Execute rent as a transaction by sending account
        return rentalnInstance.returnCar(carId, {from: account, gas:3000000});
      }).then(function(result) {
        return App.markRented();
      }).catch(function(err) {
        console.log(err.message);
      });
    });
  },

  bindEvents: function() {
    $(document).on('click', '.btn-rent', App.handleRent);
    $(document).on('click', '.btn-return', App.handleReturnCar);
    $(document).on('click', '.btn-addCar', App.handleAddCar);

    // Event listener for displaying car info in a modal
    $(document).on('click', '.btn-displayInfo', function(event) {
      // Get the relevant car information from the clicked card
      var carPanel = $(event.target).closest('.panel-car');
      var make = carPanel.find('.car-make').text();
      var year = carPanel.find('.car-year').text();
      var license = carPanel.find('.car-licenseNumber').text();
      var isAvailable = carPanel.find('.car-isAvailable').text();

      // Construct the modal content with car information
      var modalContent = `
        <div class="modal fade" id="carInfoModal" tabindex="-1" role="dialog" aria-labelledby="carInfoModalLabel" aria-hidden="true">
          <div class="modal-dialog" role="document">
            <div class="modal-content">
              <div class="modal-header">
                <h5 class="modal-title" id="carInfoModalLabel">Car Information</h5>
                <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                  <span aria-hidden="true">&times;</span>
                </button>
              </div>
              <div class="modal-body">
                <p><strong>Make:</strong> ${make}</p>
                <p><strong>Year:</strong> ${year}</p>
                <p><strong>License:</strong> ${license}</p>
                <p><strong>Available:</strong> ${isAvailable}</p>
              </div>
            </div>
          </div>
        </div>
      `;

      // Append the modal content to the body and show the modal
      $('body').append(modalContent);
      $('#carInfoModal').modal('show');
    });
  }
}

$(function() {
  $(window).load(function() {
    App.init();
  });
});
