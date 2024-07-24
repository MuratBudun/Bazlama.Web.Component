export default `
.container {
    background-color: rgba(200, 200, 200, 0.5);
    border-radius: 10px;
    padding: 10px 15px;
}

.vertical {
    display: inline-flex;
    flex-direction: column;
    gap: 10px;
    align-items: stretch;
    border-radius: 10px;
}

.horizontal {
    display: flex;
    justify-content: left;
    gap: 10px;
    align-items: stretch;
    border-radius: 10px;
}

.title {
    font: 1.5em sans-serif;
    font-weight: bold;
    padding: 5px 0;
}

.card {
    background-color: rgba(200, 200, 200, 0.5);
    padding: 10px;
    border-radius: 10px;
    display: flex;
    flex-direction: column;
    min-width: 200px;
}

.form-control {
    font: 0.9em sans-serif;
    display: flex;
    flex-direction: column;
    gap: 5px;
    padding: 5px;
}

.form-control label {
    font-weight: bold;
}

.form-control input {
    padding: 5px;
    border-radius: 5px;
    border: 1px solid #ccc;
}

.form-control input:focus {
    outline: none;
    border-color: #d19d2ed1;
}
`