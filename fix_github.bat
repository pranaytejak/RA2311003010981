@echo off
echo Fixing GitHub folder issue...
git rm --cached notification_app_be -r
echo.
echo Deleting hidden .git mistake...
rmdir /s /q notification_app_be\.git
echo.
echo Adding all files to Git...
git add .
echo.
echo Committing files...
git commit -m "Fill notification folder"
echo.
echo Pushing everything to GitHub...
git push origin main
echo.
echo ALL DONE! Your GitHub folder should now be filled!
pause
