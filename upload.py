# from rdkit import Chem
# from rdkit.Chem import Draw

import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore
from firebase_admin import storage

# Use a service account
cred = credentials.Certificate('./chempix-9163782a8d89.json')
firebase_admin.initialize_app(cred, {
	'storageBucket': 'chempix.appspot.com'
})
bucket = storage.bucket()

db = firestore.client()

i = 0

for line in open("./smiles_200K_halo.txt", "r"):
	# if (i < 37033):
	# 	i += 1
	# 	continue
	# # generate molecule from formula
	if (i % 1000 == 0):
		print(i)
	line=line[:-1]
	# mol = Chem.MolFromSmiles(line)
	# x = (0, 0, 0)
	# elemD = {0: x, 1: x, 7: x, 8: x, 9: x, 15: x, 16: x, 17: x, 35: x, 53: x}
	# Draw.DrawingOptions.elemDict = elemD

	# # write molecule to png image
	# Draw.MolToFile(mol, "./smiles_200k_gt/" + line + ".png")

	blob = bucket.blob('gen/' + line + '.png')
	blob.upload_from_filename(
		"./smiles_200k/" + line + ".png"
	)
	# line = line[:-1]
	doc_ref = db.collection(u'Smiles').document(str(i))
	doc_ref.set({
		u'smile': line
	})
	i += 1