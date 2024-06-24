(function ($) {
    "use strict";

    // Spinner
    var spinner = function () {
        setTimeout(function () {
            if ($('#spinner').length > 0) {
                $('#spinner').removeClass('show');
            }
        }, 1);
    };
    spinner(0);


    // Initiate the wowjs
    new WOW().init();


    // Sticky Navbar
    $(window).scroll(function () {
        if ($(this).scrollTop() > 45) {
            $('.nav-bar').addClass('sticky-top shadow-sm').css('top', '0px');
        } else {
            $('.nav-bar').removeClass('sticky-top shadow-sm').css('top', '-100px');
        }
    });


    // Header carousel
    $(".header-carousel").owlCarousel({
        animateOut: 'fadeOut',
        items: 1,
        margin: 0,
        stagePadding: 0,
        autoplay: true,
        smartSpeed: 500,
        dots: true,
        loop: true,
        nav: true,
        navText: [
            '<i class="bi bi-arrow-left"></i>',
            '<i class="bi bi-arrow-right"></i>'
        ],
    });



    // testimonial carousel
    $(".testimonial-carousel").owlCarousel({
        autoplay: true,
        smartSpeed: 1500,
        center: false,
        dots: false,
        loop: true,
        margin: 25,
        nav: true,
        navText: [
            '<i class="fa fa-arrow-right"></i>',
            '<i class="fa fa-arrow-left"></i>'
        ],
        responsiveClass: true,
        responsive: {
            0: {
                items: 1
            },
            576: {
                items: 1
            },
            768: {
                items: 2
            },
            992: {
                items: 2
            },
            1200: {
                items: 2
            }
        }
    });


    // Facts counter
    $('[data-toggle="counter-up"]').counterUp({
        delay: 5,
        time: 2000
    });


    // Back to top button
    $(window).scroll(function () {
        if ($(this).scrollTop() > 300) {
            $('.back-to-top').fadeIn('slow');
        } else {
            $('.back-to-top').fadeOut('slow');
        }
    });
    $('.back-to-top').click(function () {
        $('html, body').animate({ scrollTop: 0 }, 1500, 'easeInOutExpo');
        return false;
    });

    // Dynamic active class for nav links
    // $(document).ready(function () {
    //     const navLinks = $('.nav-item.nav-link');
    //     console.log("Document is ready, navLinks count:", navLinks.length); // Debugging statement
    //     navLinks.click(function (event) {
    //         console.log("Nav link clicked:", $(this).text()); // Debugging statement
    //         navLinks.removeClass('active');
    //         $(this).addClass('active');
    //     });
    // });
    $(document).ready(function () {
        const navLinks = $('.nav-item.nav-link');
        
        // Function to update active class based on current URL
        function updateActiveLink() {
            const currentPath = window.location.pathname;
            
            navLinks.removeClass('active');
            
            navLinks.each(function () {
                const navLink = $(this);
                const navLinkHref = navLink.attr('href');
                
                if (currentPath === navLinkHref) {
                    navLink.addClass('active');
                }
            });
        }
        
        // Initial call to set active class on page load
        updateActiveLink();
        
        // Click event handler for nav links
        navLinks.click(function (event) {
            event.preventDefault();
            
            const href = $(this).attr('href');
            
            // Update active class
            navLinks.removeClass('active');
            $(this).addClass('active');
            
            // Navigate to the clicked link
            setTimeout(function () {
                window.location.href = href;
            }, 300); // Optional delay for visual feedback, adjust as needed
        });
    });

})(jQuery);

