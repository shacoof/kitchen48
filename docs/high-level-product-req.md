I’m considering having the videos on cloud flare but the application and postgres database to be hosted in google cloud. Initial database will be postgres
 
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

Each user will be able to post recipes

# general development instructions 
-We might need to update recipe and steps tables
-I want steps table to be called recipe_steps
-remove unused columns and add new ones as needed base your decisions on the design below
- don't forget to add scripts for the deployment in prodcution 
- create necessary LOV or udpate existing ones to meet below requirements 

# Screens 
we need to have the following screens
1. user recipies screen - list of all recipes, see details below
2. recipe summary screen - recipe details screen, see detials below
3. recipe steps screen - 


## user recipies screens 
a simple list of all user's recipes, this screen will be called from main menu recipes . it will have recipe name field only and button to open recipe summary screen

## recipe summary screen
use misc\main_recipe design
screen that shows summary of the recipe

### top section 
 recipe high level info from recipe table, fields : recipe name (which is used for semantic URL), description, image, video , is published, prep time, calculated time and serving.
### bottom section 
on the left list of all the ingredients, this is a summary of all ingredients from all steps, if a certain ingredient appears in more than one step than this will show the sum of all of them. say in step 1 you need 1 cup of flour and in step 3 you need another cup of flour than the summary will show 2 cups.

## recipe steps screen 
use misc\play_recipe design
3 modes - view \ read only , edit, play 

edit button, upon pressing it we will enter edit mode where we can udpate, add, remove steps

### left pane 
 list of all the steps 
you can press a step to focus on it
### right pane
step details : video, instrucions, ingredients 



 

# Recipe data 
Name - user as semantic URL
Descrition - long rich text 
introduction video 
overall  time - sum of all wait time + preperation time of all steps
overall preperation time - sun of all preperation time of all steps 

List of steps where each step must have
List of ingredients - mandatory
0. design a regular ingredient list with name and quantity from measurement_units
1. ingredient has autocomplete from master ingredients table. user can also insert ingredient which is not in master ingredient table. 
Step description - mandatory, text that describe the step 
Short video - optional
Wait time - if there is waiting time like in the oven or for the dough to rise 
Wait time unit : seconds, minutes, hours, days
Prep time - how much preparation time is there for this step 
Prep time unit : seconds, minutes, hours
above units should be LOV


