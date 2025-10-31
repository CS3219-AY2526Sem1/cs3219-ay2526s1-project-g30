#!/usr/bin/env bash

gcloud run deploy matching-service \
	--source . \
	--region asia-southeast1 \
	--allow-unauthenticated \
	--env-vars-file env.yaml