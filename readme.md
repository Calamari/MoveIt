# MoveIt

Very small JavaScript move / translation lib using animation frames and hardware acceleration through CSS3 for optimal performance

**Version:** 0.0.11

## Usage:

Creating a Move it Element with some element:

    var mover = new MoveIt(document.getElementById('myElement'));

Moves element 100 pixel to the left and 150 pixel down:

    mover.move(-100, 150);

Setting a duration for all following translations:

    mover.duration(5);

Creating a Move it Element using CSS3 2D and 3D transformations if available:

    var mover = new MoveIt('myElement', { useTransform: true });

Sets an CSS3 transformation easing method to use in all following animations:

    mover.ease('ease-out');

After finishing of the animation a callback can be fired:

    mover.moveTo(100, 100, function() { console.log('finished'); });

If CSS3 is used we can transform the CSS3 translation to normal left and top positioning after finishing the translation:

    mover.duration(3).moveTo(100, 100, mover.convertTransform);


### Also allows chaining of methods:

Moves the element with id=box1 to page coordinates x=380px and y=300px with easing in and out in 4 seconds:

    new MoveIt('box1').duration(4).ease('ease-in-out').moveTo(380, 300);

Jumps to position left: 50px; top:50px; and moves steadily over 2 seconds to left: 150px

    new MoveIt('box1').moveTo(50,50).duration(2).move(100, 0);
