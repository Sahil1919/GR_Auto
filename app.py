from flask import Flask, render_template, request, jsonify, send_file
from flask_cors import CORS
import base64
from rich.progress import track
from AdharInfo_Extractor import AdharInfo_Extractor
import pandas as pd 
from io import BytesIO

app = Flask(__name__,static_folder='static')
CORS(app)

DF = pd.DataFrame(columns=["First Name","Middle Name",'Last Name',"Adhar Number","DOB","Gender","Address"])

def Aadhar_Extraction_Process(file_data:list) -> None:

    list_front_img = [ file['data'] for file in file_data if ".1." not in file['filename'] ]
    list_back_img = [ file['data'] for file in file_data if ".1." in file['filename'] ]

    for i,front_img,back_img in zip(track(range(len(list_front_img)), description="Extraction Process..."),list_front_img,list_back_img):
        
        adhar_info_extractor = AdharInfo_Extractor(front_img,back_img)

        adhar_number = adhar_info_extractor.adhar_number
        adhar_fullname = adhar_info_extractor.adhar_name.split()
        first_name = adhar_fullname[0]
        middle_name = adhar_fullname[1] 
        last_name = adhar_fullname[2]
        adhar_dob = adhar_info_extractor.adhar_dob
        adhar_gender = adhar_info_extractor.adhar_gender
        adhar_address = adhar_info_extractor.adhar_address

        details = [first_name,middle_name,last_name, adhar_number, adhar_dob, adhar_gender, adhar_address]
        DF.loc[len(DF)+1] = details
        
        print(adhar_fullname)
        print(adhar_number)
        print(adhar_dob)
        print(adhar_gender)
        print(adhar_address)

        print("----------------------------------------------------")

    
    # DF.to_excel("/StudentDetails.xlsx",index=False) 

@app.route('/')
def main():
    return render_template('index.html')

@app.route('/uploads', methods=['POST'])
def upload_file():
    
    global DF

    files = request.files.getlist('files')
    if not files:
        return jsonify({'error': 'No files uploaded'})
    
    if len(DF) > 1:
        DF = DF[0:0]
    # DF.drop(columns=DF.columns, inplace=True)
    file_data = []
    for file in files:
        if file.filename == '':
            return jsonify({'error': 'One or more files have no selected file'})

        file_data.append({
            'filename': file.filename,
            'data': base64.b64encode(file.stream.read()).decode('utf-8')  # Convert file content to base64-encoded string
        })
    

    Aadhar_Extraction_Process(file_data)

    return jsonify({'message': 'Files uploaded successfully', 'files': file_data})

    # return jsonify({'message': 'Files uploaded successfully', 'filenames': filenames})

# Set up route for downloading the processed DataFrame as an Excel file
@app.route('/download_excel', methods=['GET'])
def download_excel():

    excel_buffer = BytesIO()

    # Save the DataFrame to the BytesIO object as an Excel file
    DF.to_excel(excel_buffer, index=False)

    # Set the file pointer to the beginning of the BytesIO object
    excel_buffer.seek(0)

    # Return the Excel file as a response
    return send_file(excel_buffer,
                     mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                     as_attachment=True,
                     download_name='StudentDetails.xlsx')

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
