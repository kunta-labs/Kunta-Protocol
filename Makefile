run:
	make clean_storage;
	HTTP_PORT=3001 P2P_PORT=6001 npm run protocol
br:
	make build;
	make;
build:
	npm rebuild;
clean_storage:
	rm -rf storage/RI_TARGETED storage/B_CREATED storage/RI_STOREDIN storage/A_MINED
	rm -f storage/BC/*.kb
save:
	git add * -v;
	git commit -am "default save core" -v;
	git push origin master -v ;
