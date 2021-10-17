### Astrotrac 360 UI

Adapted from version 1.1 of Astrotrac 360 Web UI. Slew and encoder mapping logics adapted from https://github.com/indilib/indi/blob/master/drivers/telescope/astrotrac.cpp

**Instructions:**

 

0. At this stage, I recommend you not to mount anything when you test this.

 

1. Connect to the mount's wifi on your computer. Note down the RA drive's IP address. 

 

2. Open the "AstroTrac360.html" file with your browser on your computer. No need to upload anything.

 

(Optional) Bring up the developer tools in Chrome/MS Edge by pressing F12. Go to the "Console" tab to see the logs.

 

3. Enter the IP address then press CONNECT. Wait a few seconds.

 

4. Try one of the handcontroller buttons. If the mount moves then we can attempt the alignment.

 

5. Enter the RA, DEC coordinates of the alignment star/object in decimal degrees. I know it is a pain to convert the coordinates, but for simplicity you might have to make do for now.

    What this will do is to create a "local alignment" by calculating the local sidereal time at the time of alignment.

    *Refreshing the page will lose the alignment and the connection, but it might be a good thing to do if the mount started behaving eratically. 

 

6. If my code worked this far, I suppose you can let it press the Goto button and theoretically it should slew to Andromeda Galaxy, if the polar alignment and one star alignment were done correctly.
