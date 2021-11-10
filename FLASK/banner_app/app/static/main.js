$(document).ready(function(){
  // code
  var offset = 12;
  document.getElementById('showmore').addEventListener('click', function (event) {
    req = $.ajax({
      url: '/show_more_banner/' + offset,
      type: 'GET',
      success:function(data){
        // alert(data.length);
        if (data === '0'){
          alert('no data to be loaded!');
          $('#showmore').hide();
        }else{
          $('#loaddata').append(data);
          offset*=2
        }
      },
      complete: function () {
        $( document ).ajaxStop(function() {
            //now that all have been added to the dom, you can put in some code for your needs.
            console.log($(".subareafilterActive").get().length)

            $('.portfolio-menu ul li').click(function(){
              $('.portfolio-menu ul li').removeClass('active');
              $(this).addClass('active');
              
              var selector = $(this).attr('data-filter');
              $('.portfolio-item').isotope({
                filter:selector
              });
              return  false;
            });
            $(document).ready(function() {
              var popup_btn = $('.popup-btn');
              popup_btn.magnificPopup({
                type : 'image',
                gallery : {
                  enabled : true
                }
              });
            });

        })
      }
    });
  });
});

// $('.portfolio-item').isotope({
//  	itemSelector: '.item',
//  	layoutMode: 'fitRows'
//  });
$('.portfolio-menu ul li').click(function(){
  $('.portfolio-menu ul li').removeClass('active');
  $(this).addClass('active');
  
  var selector = $(this).attr('data-filter');
  $('.portfolio-item').isotope({
    filter:selector
  });
  return  false;
});
$(document).ready(function() {
  var popup_btn = $('.popup-btn');
  popup_btn.magnificPopup({
    type : 'image',
    gallery : {
      enabled : true
    }
  });
});

