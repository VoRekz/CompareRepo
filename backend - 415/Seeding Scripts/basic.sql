--DROP SCHEMA public CASCADE;
--CREATE SCHEMA public;

--ADD STAFF VALUES
INSERT INTO staff ("username", "password", first_name, last_name, "role")
VALUES
('tony_stark', 'tony_stark', 'Tony', 'Stark', 'Owner'),
('pepper_potts', 'pepper_potts', 'Pepper', 'Potts', 'Sales Agent'),
('happy_hogan', 'happy_hogan', 'Happy', 'Hogan', 'Acquisition Specialist'),
('bucky_barnes', 'bucky_barnes', 'Bucky', 'Barnes', 'Acquisition Specialist'),
('bruce_banner', 'bruce_banner', 'Bruce', 'Banner', 'Operating Manager');

--ADD CUSTOMER VALUES
INSERT INTO customer (customer_id, email, phone_number, street_address, city, "state", postal_code)
VALUES
(12345, 'm.parker@feast.org', '111-111-1111', '123 Main St', 'New York', 'New York', 10411),
(12346, 'steve.rogers.1918@gmail.org', '222-222-2222', '45 Fulton St', 'New York', 'New York', 10443),
(91234, 'n.osborn@osborn.com', '999-999-9999', '135 E 57th St', 'New York', 'New York', 10022),
(91235, 'wilson.fisk@fisk_industries.com', '888-888-8888', '166 W 18th St', 'New York', 'New York', 10465);

--ADD INDIVIDUAL
INSERT INTO individual (ssn, customer_id, first_name, last_name)
VALUES
(111111111, 12345, 'May', 'Parker'),
(222222222, 12346, 'Steve', 'Rogers');

--ADD BUSINESS
INSERT INTO business (tax_id, customer_id, business_name, contact_first_name, contact_last_name, contact_title)
VALUES
('bz-99912', 91234, 'Oscorp', 'Norman', 'Osborn', 'CEO'),
('bz-99913', 91235, 'Fisk Industries', 'Wilson', 'Fisk', 'CEO');

--ADD VENDOR
INSERT INTO vendor (vendor_name, phone_number, street_address, city, "state", postal_code)
VALUES
('Max Parts', '333-123-4567', '345 Hilcroft', 'New York', 'New York', 12311),
('Stark Industries', '333-123-4000', '200 Park Ave', 'New York', 'New York', 10231),
('Solid Works', '333-123-1231', '345 Wilcrest', 'New York', 'New York', 12300);

--ADD VEHICLE TYPES
INSERT INTO vehicle_type (vehicle_type)
VALUES
('Convertible'),
('Coupe'),
('Minivan'),
('Other'),
('Sedan'),
('SUV'),
('Truck'),
('Van');

--ADD VEHICLE MANUFACTURER
INSERT INTO vehicle_manufacturer (manufacturer_name)
VALUES
('Acura'),
('Alfa Romeo'),
('Aston Martin'),
('Audi'),
('Bentley'),
('BMW'),
('Buick'),
('Cadillac'),
('Chevrolet'),
('Chrysler'),
('Dodge'),
('Ferrari'),
('FIAT'),
('Ford'),
('Geely'),
('Genesis'),
('GMC'),
('Honda'),
('Hyundai'),
('INFINITI'),
('Jaguar'),
('Jeep'),
('Karma'),
('Kia'),
('Lamborghini'),
('Land Rover'),
('Lexus'),
('Lincoln'),
('Lotus'),
('Maserati'),
('MAZDA'),
('McLaren'),
('Mercedes-Benz'),
('MINI'),
('Mitsubishi'),
('Nissan'),
('Nio'),
('Porsche'),
('Ram'),
('Rivian'),
('Rolls-Royce'),
('smart'),
('Subaru'),
('Tesla'),
('Toyota'),
('Volkswagen'),
('Volvo'),
('XPeng');

--ADD VEHICLES
INSERT INTO vehicle (vin, vehicle_type, manufacturer_name, model_name, model_year, fuel_type, horse_power, drive_train, notes)
VALUES
('ABCDEFGH1234567890', 'SUV', 'Honda', 'Pilot', 2011, 'Hybrid', 240, 'AWD', 'Well-maintained'),
('ABCDEFGH1234567891', 'Sedan', 'Toyota', 'Corolla', 2024, 'Gas', 240, 'FWD', 'Needs work'),
('ABCDEFGH1234567892', 'Truck', 'Toyota', 'Tacoma', 2025, 'Gas', 240, '4WD', 'Low mileage'),
('ABCDEFGH1234567893', 'Van', 'Honda', 'Odessey', 1990, 'Gas', 240, 'AWD', 'Probably worth parts only'),
('ABCDEFGH1234567894', 'Convertible', 'XPeng', 'Miata', 2021, 'Gas', 240, 'AWD', 'Sporty');

--ADD VEHICLE COLORS
INSERT INTO vehicle_color (vin, color)
VALUES
('ABCDEFGH1234567890', 'Red'),
('ABCDEFGH1234567890', 'White'),
('ABCDEFGH1234567894', 'Gray'),
('ABCDEFGH1234567892', 'White'),
('ABCDEFGH1234567893', 'Green'),
('ABCDEFGH1234567891', 'Blue');

--ADD PURCHASE TRANSACTION
INSERT INTO purchase_transaction (vin, customer_id, username, purchase_date, purchase_price, purchase_condition)
VALUES
('ABCDEFGH1234567890', 12345, 'bucky_barnes', '2026-01-02', 10000.10, 'Rough'),
('ABCDEFGH1234567892', 12346, 'happy_hogan', '2026-01-24', 40000.00, 'Excellent'),
('ABCDEFGH1234567891', 12346, 'bucky_barnes', '2026-03-10', 30000.00, 'Very Good'),
('ABCDEFGH1234567893', 12346, 'happy_hogan', '2026-01-24', 40000.00, 'Good'),
('ABCDEFGH1234567894', 91234, 'happy_hogan', '2026-01-24', 10000.50, 'Fair');

--ADD SALES TRANSACTION
INSERT INTO sales_transaction (vin, customer_id, username, sales_date, sales_price)
VALUES
('ABCDEFGH1234567892', 91234, 'happy_hogan', '2026-01-28', 30000.00),
('ABCDEFGH1234567890', 12346, 'bucky_barnes', '2026-02-14', 40000.00);

--ADD PARTS ORDER
INSERT INTO parts_order (vin, ordinal_number, vendor_name, acquisitionspecialist)
VALUES
('ABCDEFGH1234567890', '00001', 'Solid Works', 'happy_hogan'),
('ABCDEFGH1234567890', '00002', 'Max Parts', 'happy_hogan'),
('ABCDEFGH1234567890', '00003', 'Stark Industries', 'happy_hogan'),
('ABCDEFGH1234567892', '00001', 'Stark Industries', 'bucky_barnes');

--ADD PART
INSERT INTO part (vin, ordinal_number, vendor_part_number, part_name, description, unit_price, status, quantity, vendor_name)
VALUES
('ABCDEFGH1234567890', '00001', 'AAA-12345', 'Tire', 'General purpose tire', 100.00, 'ordered', 4, 'Stark Industries'),
('ABCDEFGH1234567890', '00002', 'AAA-12340', 'Wipers', 'General wipers', 10.00, 'installed', 1, 'Solid Works'),
('ABCDEFGH1234567892', '00001', 'BBB-12345', 'Transmission', 'OEM Transmission', 7000.00, 'ordered', 1, 'Max Parts');


--ADD COLOR
INSERT INTO color (color_name)
VALUES
('Aluminum'),
('Beige'),
('Black'),
('Blue'),
('Brown'),
('Bronze'),
('Claret'),
('Copper'),
('Cream'),
('Gold'),
('Gray'),
('Green'),
('Maroon'),
('Metallic'),
('Navy'),
('Orange'),
('Pink'),
('Purple'),
('Red'),
('Rose'),
('Rust'),
('Silver'),
('Tan'),
('Turquoise'),
('White'),
('Yellow');
