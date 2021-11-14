### Astrotrac 360 UI

Adapted from version 1.1 of Astrotrac 360 Web UI. Slew and encoder mapping logics adapted from https://github.com/indilib/indi/blob/master/drivers/telescope/astrotrac.cpp

**This software is provided on an "As-Is" basis and I am not responsible for any consequence resulted from using this software.**

**Instructions:**

 

0. At this stage, ~~I recommend you not to mount anything when you test this~~ the code is much more robust than it was before. You can try mounting a laser or a small refractor at your own risk.

 

1. Connect to the mount's wifi on your computer. Note down the RA drive's IP address. 

 

2. Open the "AstroTrac360.html" file with your browser on your computer. No need to upload anything.

 

(Optional) Bring up the developer tools in Chrome/MS Edge by pressing F12. Go to the "Console" tab to see the logs.

 

3. Enter the IP address then press CONNECT. Wait a few seconds.

 

4. Try one of the handcontroller buttons. If the mount moves then we can attempt the alignment.

 

5. Enter the RA, DEC coordinates of the alignment star/object.
    What this will do is to create a "local alignment" by calculating the local sidereal time at the time of alignment, as well as a DEC offset.

    *Refreshing the page will lose the alignment and the connection, but it might be a good thing to do if the mount started behaving eratically. 

    *Persistent alignment/auto resume is implemented, but will not work while used on a local machine. 

 

6. Enter the coordinates for the GOTO target and press GOTO button. Abort if the mount is running into things.

7. If the mount start behaving erratically, switch it off and on again. It should be back to normal.
