## registration and login 
It will support the following flow 
1. user arrives to the website
2. user is being asked to login or register 
3. User will register by either 
3.1 Email and password, where email verification will be sent
3.2 Using their existing Google, facebook, instagram accounts
4. user is created in the database which will hold user basic info including 
 first and last name, email address, mobile phone number and country, password related information, and description
5. suport all registration workflow including waiting for email approval 


There will be 2 websites 
public - www.kitchen48.com - this will be for everyone
admin - admin.kitchen48.com - this will only be for aminstrator and developer 



I’m considering having the videos on cloud flare but the application and postgres database to be hosted in google cloud. Initial database will be postgres
 
Multi language support : 
Multi language support built in the system 
User can set his language in user setting screens
Language will impact 
labels (should be stored in the database)
User voice command
System audio - when reading instructions etc. 


Each user will be able to post recipes
Each recipe has 
List of steps where each step must have
List of ingredients - mandatory 
Step description - mandatory, text that describe the step 
Short video - optional
Wait time - if there is waiting time like in the over or for the dough to rise 
Wait time unit : seconds, minutes, hours, days
Prep time - how much preparation time is there for this step 
Prep time unit : seconds, minutes, hours
Each user can search for recipe and either view the recipe or play it
Viewing a recipe means you can see all information and play videos manually one by one
Playing a recipe means you enter a play-mode where you can control the application using voice commands or screen buttons moving forward and backwards etc. 
Voice Commands will be 
Describe - using text to speech the application will read the step description
Ingredients - using text to speech the application will read the step ingredients 
Play video - playing the step video
Stop - stopping any audio or video playing 
Next - moving the next step 
Previous - moving to the previous step.
Louder - increasing the volume
Quiter - reducing the volume 
Activate timer - starting the timer for the step 
Alternative - finding alternative to certain ingredient

The system will support multi languages, the user will be able to select the language in his settings. Language will control voice commands, audio, titles, recipe language, and system (metric, imperial)






Application will have the following modules 
Account
Registration / Login
Payment
History
Basic search
Author
Cousine 
Recipe Name
Ingredients
Rank
Upload recipe 
Steps
Text
Pictures
Video
Keywords
Ingredients 
Basic metadata
Play recipe
Hand / voice control
Text to speech 
Rank a recipe - scale of 1 to 5 stars for
Complexity level 
Accuracy of instructions 
Comment
Devices support 
Browser - any device 
Iphone 
Android 
Pads
Technical 
Scaleable 
Availability
Fast
CI/CD support 
UX
State of the art 
Sizing 
Small / medium / big
No of users : 10k /  1m / 100m
No of contributors : 100 / 10k / 1m
No of recipes :  1k / 1m / 100m
Video length : 10m per recipe 
No of videos per recipe : 5
No of pictures per ceipe : 100

